import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from './securityAudit.ts';
import { behavioralFirewall } from '../middleware/behavioralFirewall.ts';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  actionName?: string;
  skipFailedRequests?: boolean;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  reset(key: string): Promise<void>;
}

/**
 * In-memory sliding window store with automatic eviction (Local Emergency Limiter)
 */
class MemoryRateLimitStore implements RateLimitStore {
  private hits: Map<string, number[]> = new Map();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const timestamps = (this.hits.get(key) || []).filter(t => now - t < windowMs);
    timestamps.push(now);
    this.hits.set(key, timestamps);

    const resetTime = (timestamps[0] || now) + windowMs;
    return { count: timestamps.length, resetTime };
  }

  async reset(key: string): Promise<void> {
    this.hits.delete(key);
  }
}

/**
 * Distributed-Ready Rate Limiter
 * Pluggable backend (MemoryStore for local containment / RedisStore for distributed clusters)
 */
export class DistributedRateLimiter {
  private store: RateLimitStore;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number, customStore?: RateLimitStore) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.store = customStore || new MemoryRateLimitStore();
  }

  public async check(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number; count: number }> {
    const { count, resetTime } = await this.store.increment(key, this.windowMs);
    const remaining = Math.max(0, this.maxRequests - count);
    const allowed = count <= this.maxRequests;
    return { allowed, remaining, resetTime, count };
  }
}

/**
 * Express Middleware factory for Centralized Rate / Abuse Policy
 */
export function applyRateLimit(options: RateLimitOptions) {
  const limiter = new DistributedRateLimiter(options.windowMs, options.maxRequests);
  const actionName = options.actionName || 'ENDPOINT_REQUEST';

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : behavioralFirewall.extractClientKey(req);
    const { allowed, remaining, resetTime, count } = await limiter.check(key);

    // Standard IETF RateLimit headers
    res.setHeader('RateLimit-Limit', options.maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', Math.ceil((resetTime - Date.now()) / 1000));

    if (!allowed) {
      // Record abuse anomaly in behavioral firewall
      behavioralFirewall.recordAnomaly(
        key,
        'RATE_LIMIT_EXCEEDED',
        2,
        { actionName, count, maxRequests: options.maxRequests },
        req
      );

      logSecurityEvent({
        category: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        action: `RATE_LIMIT_EXCEEDED_${actionName}`,
        actor: key,
        ip: req.ip || '127.0.0.1',
        details: { path: req.path, count, max: options.maxRequests },
      });

      res.setHeader('Retry-After', Math.ceil((resetTime - Date.now()) / 1000));
      return res.status(429).json({
        error: 'Muitas requisições. Limite de segurança excedido, tente novamente em breve.',
        code: 'SECURITY_RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.ceil((resetTime - Date.now()) / 1000),
      });
    }

    next();
  };
}

// Backward-compatible re-exports from clientRateLimiter
export { SlidingWindowRateLimiter, saveRateLimiter } from './clientRateLimiter.ts';
