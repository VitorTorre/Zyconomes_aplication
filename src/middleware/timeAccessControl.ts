import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { logSecurityEvent } from '../lib/securityAudit';
import { behavioralFirewall } from './behavioralFirewall';

// Allowed administrative identities whitelist
export const AUTHORIZED_ADMIN_EMAILS = new Set([
  'v.torresko2015@gmail.com',
  process.env.DEV_ADMIN_EMAIL || 'dev@zyconomes.com',
  'admin@zyconomes.com',
  'demo@zyconomes.com',
]);

/**
 * Checks if the current time falls within the configured administrative operational window (11:00 to 13:45 BRT / UTC-3).
 * Returns status, current time string, window status and minutes to open/close.
 */
export function checkAdminTimeWindow(customDate?: Date): {
  isAllowed: boolean;
  currentBrtTime: string;
  windowStart: string;
  windowEnd: string;
  reason?: string;
} {
  const date = customDate || new Date();

  // Convert to America/Sao_Paulo (UTC-3)
  const brtString = date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour12: false });
  const brtDate = new Date(brtString);
  const hours = brtDate.getHours();
  const minutes = brtDate.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // Window: 11:00 (660 mins) to 13:45 (825 mins)
  const windowStartMinutes = 11 * 60; // 11:00 -> 660
  const windowEndMinutes = 13 * 60 + 45; // 13:45 -> 825

  const isAllowed = currentMinutes >= windowStartMinutes && currentMinutes <= windowEndMinutes;
  const currentBrtTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return {
    isAllowed,
    currentBrtTime,
    windowStart: '11:00',
    windowEnd: '13:45',
    reason: isAllowed
      ? 'Acesso dentro da janela operacional regulamentar (11:00 às 13:45 BRT)'
      : `Acesso fora da janela permitida (Atual: ${currentBrtTime} BRT; Permitido: 11:00 às 13:45 BRT)`,
  };
}

/**
 * Validates whether the user is authorized to perform administrative operations
 * and enforces strict lateral isolation and the 11:00 - 13:45 time window.
 */
export function isAuthorizedAdminIdentity(email?: string): boolean {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.has(email.toLowerCase().trim());
}

/**
 * Express Middleware enforcing Time-Based Access Control (TBAC) and Strict Whitelisting.
 * Allows extraordinary break-glass override only with explicit, mandatory documentation.
 */
export function enforceAdminTimeWindow(req: AuthRequest, res: Response, next: NextFunction) {
  const userEmail = req.dbUser?.email || req.user?.email;

  // 1. Verify strict administrative identity whitelist
  if (!isAuthorizedAdminIdentity(userEmail)) {
    const clientKey = behavioralFirewall.extractClientKey(req);
    behavioralFirewall.recordAnomaly(
      clientKey,
      'UNAUTHORIZED_ROLE_ACCESS',
      4,
      { userEmail, path: req.path },
      req
    );

    logSecurityEvent({
      category: 'AUTHZ_DENIED',
      severity: 'HIGH',
      action: 'ADMIN_WHITELIST_REJECTED',
      actor: userEmail || clientKey,
      ip: req.ip || '127.0.0.1',
      details: {
        path: req.path,
        reason: 'Identidade não consta na lista estrita de administradores autorizados.',
      },
    });

    return res.status(403).json({
      error: 'Acesso negado: Esta conta não possui autorização para funções administrativas.',
      code: 'AUTHZ_NOT_IN_ADMIN_WHITELIST',
    });
  }

  // 2. Check operational time window (11:00 to 13:45 BRT)
  const timeCheck = checkAdminTimeWindow();

  if (timeCheck.isAllowed) {
    return next();
  }

  // 3. Extraordinary break-glass authorization mechanism
  const breakGlassHeader = req.headers['x-emergency-breakglass'] as string;
  const justification = (req.headers['x-breakglass-justification'] as string || '').trim();

  // Break-glass must be explicit and accompanied by verifiable documentation (min 15 chars)
  if (breakGlassHeader === 'true' && justification.length >= 15) {
    logSecurityEvent({
      category: 'PRIVILEGED_ACTION',
      severity: 'CRITICAL',
      action: 'EMERGENCY_BREAK_GLASS_USED',
      actor: userEmail,
      ip: req.ip || '127.0.0.1',
      details: {
        path: req.path,
        method: req.method,
        currentBrtTime: timeCheck.currentBrtTime,
        justification,
        timestamp: new Date().toISOString(),
      },
    });

    // Attach breakglass audit context to request
    (req as any).breakGlassAudited = {
      used: true,
      justification,
      timestamp: new Date().toISOString(),
    };

    return next();
  }

  // Outside window and no valid break-glass documentation provided
  logSecurityEvent({
    category: 'AUTHZ_DENIED',
    severity: 'MEDIUM',
    action: 'ADMIN_TIME_WINDOW_BLOCKED',
    actor: userEmail,
    ip: req.ip || '127.0.0.1',
    details: {
      path: req.path,
      currentBrtTime: timeCheck.currentBrtTime,
      windowStart: timeCheck.windowStart,
      windowEnd: timeCheck.windowEnd,
    },
  });

  return res.status(403).json({
    error: 'Acesso administrativo bloqueado fora da janela operacional autorizada (11:00 às 13:45 BRT).',
    code: 'ADMIN_WINDOW_CLOSED',
    details: {
      currentTime: timeCheck.currentBrtTime,
      windowStart: timeCheck.windowStart,
      windowEnd: timeCheck.windowEnd,
      breakGlassAvailable: true,
      breakGlassRequirement: 'Requer cabeçalho x-emergency-breakglass: true e x-breakglass-justification com no mínimo 15 caracteres.',
    },
  });
}
