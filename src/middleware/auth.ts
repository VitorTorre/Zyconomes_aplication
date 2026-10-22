import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';
import { LRUCache } from 'lru-cache';
import { isTokenRevoked, revokeToken, getRevocationLedgerStats } from './tokenRevocation.ts';

// Cache LRU: máx 10.000 usuários, TTL de 5 minutos
const userCache = new LRUCache<string, any>({
  max: 10000,
  ttl: 1000 * 60 * 5,
});

// Single-flight stampede protection: evita que requisições concorrentes idênticas sobrecarreguem o PostgreSQL
const inFlightLookups = new Map<string, Promise<any>>();

// Métricas de diagnóstico de desempenho do Cache
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  savedUpserts: 0,
};

export function getCacheStats() {
  return {
    ...cacheMetrics,
    cachedUsersCount: userCache.size,
    hitRatio: cacheMetrics.hits + cacheMetrics.misses > 0 
      ? Number(((cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses)) * 100).toFixed(2))
      : 0
  };
}

export function setCachedUser(uid: string, user: any) {
  userCache.set(uid, user);
}

export function getUserCached(uid: string) {
  return userCache.get(uid);
}

// Helper com Single-Flight Promise Coalescing
export async function getOrCreateUserCoalesced(
  uid: string, 
  email: string,
  fetchFn: (uid: string, email: string) => Promise<any> = getOrCreateUser
): Promise<any> {
  const cached = userCache.get(uid);
  if (cached) {
    cacheMetrics.hits++;
    cacheMetrics.savedUpserts++;
    return cached;
  }

  cacheMetrics.misses++;

  // Se já houver uma busca idêntica em trânsito, anexa à mesma Promise
  if (inFlightLookups.has(uid)) {
    return inFlightLookups.get(uid);
  }

  const lookupPromise = (async () => {
    try {
      const dbUser = await fetchFn(uid, email);
      if (dbUser) {
        userCache.set(uid, dbUser);
      }
      return dbUser;
    } finally {
      inFlightLookups.delete(uid);
    }
  })();

  inFlightLookups.set(uid, lookupPromise);
  return lookupPromise;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: any;
}

export function isDemoTokenAllowed(
  token: string,
  env: { nodeEnv?: string; enableDemo?: string; demoToken?: string } = {}
): boolean {
  const nodeEnv = env.nodeEnv !== undefined ? env.nodeEnv : process.env.NODE_ENV;
  const enableDemo = env.enableDemo !== undefined ? env.enableDemo : process.env.ENABLE_DEMO_LOGIN;
  const demoToken = env.demoToken !== undefined ? env.demoToken : process.env.DEMO_TOKEN;

  const isDemoAllowed = nodeEnv !== 'production' && enableDemo === 'true';
  return Boolean(
    isDemoAllowed && (
      (demoToken && token === demoToken) ||
      token === 'demo-email-token-123' ||
      token.startsWith('demo-')
    )
  );
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.substring(7).trim();
  
  // Guard against literal string values 'null', 'undefined', or empty strings from localStorage
  if (!token || token === 'null' || token === 'undefined' || token === '""') {
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  // 0. Bloqueio instantâneo em todos os endpoints para tokens revogados (Blacklist O(1))
  if (isTokenRevoked(token)) {
    return res.status(401).json({ 
      error: 'Unauthorized: Token has been revoked across all endpoints',
      code: 'auth/token-revoked' 
    });
  }
  
  // 1. Strict demo token isolation: strictly forbidden in production or unless explicitly enabled
  const isDemo = isDemoTokenAllowed(token);

  if (isDemo) {
    req.user = {
      aud: 'demo-project',
      uid: 'demo-user-123',
      email: 'demo@zyconomes.com',
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: 'https://securetoken.google.com/demo-project',
      sub: 'demo-user-123',
      firebase: { identities: {}, sign_in_provider: 'custom' }
    } as any;

    try {
      let dbUser = userCache.get('demo-user-123');
      if (!dbUser) {
        dbUser = await getOrCreateUser('demo-user-123', 'demo@zyconomes.com');
        if (dbUser) userCache.set('demo-user-123', dbUser);
      }
      req.dbUser = dbUser;
    } catch (e) {
      req.dbUser = { id: 1, uid: 'demo-user-123', email: 'demo@zyconomes.com', tier: 'premium' };
    }
    return next();
  }

  // A valid Firebase ID token is always a 3-part JWT (header.payload.signature).
  // Checking this prevents calling verifyIdToken on malformed strings and avoids FirebaseAuthError: auth/argument-error.
  const parts = token.split('.');
  if (parts.length !== 3) {
    return res.status(401).json({ error: 'Unauthorized: Invalid ID token structure' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    req.user = decodedToken;

    // Verificação de revogação por timestamp de sessão ou UID
    if (isTokenRevoked(token, uid, decodedToken.iat)) {
      return res.status(401).json({ 
        error: 'Unauthorized: Session has been terminated across all endpoints',
        code: 'auth/session-terminated' 
      });
    }
    
    // 1. Tenta cache em memória primeiro ou busca coalescida evitando sobrecarga no banco de dados
    let dbUser: any = null;
    if (decodedToken.email) {
      dbUser = await getOrCreateUserCoalesced(uid, decodedToken.email);
    } else {
      dbUser = userCache.get(uid);
    }

    req.dbUser = dbUser;
    
    next();
  } catch (error: any) {
    // Catch FirebaseAuthError specifically and avoid verbose crashes on argument or expired errors
    const errorCode = error?.code || '';
    if (errorCode === 'auth/argument-error' || errorCode === 'auth/id-token-expired' || errorCode === 'auth/id-token-revoked' || errorCode === 'auth/invalid-id-token') {
      return res.status(401).json({ 
        error: 'Unauthorized: Invalid or expired token',
        code: errorCode 
      });
    }

    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Invalida cache no logout ou alteração de plano
export function invalidateUserCache(uid: string) {
  userCache.delete(uid);
}

// Re-exporta utilitários de revogação para uso nos endpoints de autenticação e logout
export { revokeToken, isTokenRevoked, getRevocationLedgerStats };
