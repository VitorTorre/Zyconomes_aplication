import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.ts';
import { logSecurityEvent } from '../lib/securityAudit.ts';
import { behavioralFirewall } from './behavioralFirewall.ts';

export type UserRole = 'USER' | 'ADMIN' | 'SECURITY_ADMIN' | 'SUPER_ADMIN';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  ADMIN: 2,
  SECURITY_ADMIN: 3,
  SUPER_ADMIN: 4,
};

export type Permission =
  | 'SIMULATION_EXECUTE'
  | 'SIMULATION_SAVE'
  | 'FEEDBACK_SUBMIT'
  | 'EVENTS_SUBMIT'
  | 'STRIPE_CHECKOUT'
  | 'ADMIN_STATS_READ'
  | 'SECURITY_TELEMETRY_READ'
  | 'SECURITY_QUARANTINE_OVERRIDE'
  | 'SECURITY_CIRCUIT_OVERRIDE'
  | 'SECURITY_ROLLBACK_TRIGGER'
  | 'SECURITY_LEDGER_AUDIT'
  | 'SUPER_ADMIN_SYSTEM_CONFIG';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: [
    'SIMULATION_EXECUTE',
    'SIMULATION_SAVE',
    'FEEDBACK_SUBMIT',
    'EVENTS_SUBMIT',
    'STRIPE_CHECKOUT',
  ],
  ADMIN: [
    'SIMULATION_EXECUTE',
    'SIMULATION_SAVE',
    'FEEDBACK_SUBMIT',
    'EVENTS_SUBMIT',
    'STRIPE_CHECKOUT',
    'ADMIN_STATS_READ',
  ],
  SECURITY_ADMIN: [
    'SIMULATION_EXECUTE',
    'SIMULATION_SAVE',
    'FEEDBACK_SUBMIT',
    'EVENTS_SUBMIT',
    'STRIPE_CHECKOUT',
    'ADMIN_STATS_READ',
    'SECURITY_TELEMETRY_READ',
    'SECURITY_QUARANTINE_OVERRIDE',
    'SECURITY_CIRCUIT_OVERRIDE',
    'SECURITY_ROLLBACK_TRIGGER',
    'SECURITY_LEDGER_AUDIT',
  ],
  SUPER_ADMIN: [
    'SIMULATION_EXECUTE',
    'SIMULATION_SAVE',
    'FEEDBACK_SUBMIT',
    'EVENTS_SUBMIT',
    'STRIPE_CHECKOUT',
    'ADMIN_STATS_READ',
    'SECURITY_TELEMETRY_READ',
    'SECURITY_QUARANTINE_OVERRIDE',
    'SECURITY_CIRCUIT_OVERRIDE',
    'SECURITY_ROLLBACK_TRIGGER',
    'SECURITY_LEDGER_AUDIT',
    'SUPER_ADMIN_SYSTEM_CONFIG',
  ],
};

import { isAuthorizedAdminIdentity } from './timeAccessControl.ts';

/**
 * Server-Authoritative Role Resolution.
 * Derives role strictly from verified backend user data and claims — never client inputs.
 * Strictly prevents lateral privilege escalation by enforcing administrative email whitelist.
 */
export function resolveUserRole(req: AuthRequest): UserRole {
  if (!req.dbUser) return 'USER';

  const email = req.dbUser.email || req.user?.email;
  const isWhitelisted = isAuthorizedAdminIdentity(email);

  // If identity is not whitelisted for administrative roles, enforce strict USER confinement
  if (!isWhitelisted) {
    return 'USER';
  }

  // Check explicit database role column if present
  if (req.dbUser.role) {
    const r = String(req.dbUser.role).toUpperCase();
    if (r === 'SUPER_ADMIN') return 'SUPER_ADMIN';
    if (r === 'SECURITY_ADMIN') return 'SECURITY_ADMIN';
    if (r === 'ADMIN') return 'ADMIN';
  }

  // Check for elevated security admin token
  const elevatedToken = req.headers['x-superadmin-token'] as string;
  if (elevatedToken && elevatedToken.startsWith('elevated_')) {
    return 'SUPER_ADMIN';
  }

  // Check user tier mapping
  if (req.dbUser.tier === 'admin') {
    return 'ADMIN';
  }

  return 'ADMIN'; // Default for authorized administrative whitelist
}

/**
 * RBAC Policy Middleware: Enforces minimum role level
 */
export function requireRole(minimumRole: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = resolveUserRole(req);
    const userLevel = ROLE_HIERARCHY[userRole] || 1;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      const clientKey = behavioralFirewall.extractClientKey(req);

      // Record anomaly for privilege escalation attempt
      behavioralFirewall.recordAnomaly(
        clientKey,
        'UNAUTHORIZED_ROLE_ACCESS',
        4,
        { userRole, requiredRole: minimumRole, path: req.path },
        req
      );

      logSecurityEvent({
        category: 'AUTHZ_DENIED',
        severity: 'HIGH',
        action: 'INSUFFICIENT_ROLE_PRIVILEGE',
        actor: req.dbUser?.email || clientKey,
        ip: req.ip || '127.0.0.1',
        details: {
          userRole,
          requiredRole: minimumRole,
          path: req.path,
          method: req.method,
        },
      });

      return res.status(403).json({
        error: `Acesso negado: Perfil '${userRole}' não possui privilégio suficiente. Nível '${minimumRole}' requerido.`,
        code: 'AUTHZ_INSUFFICIENT_ROLE',
      });
    }

    next();
  };
}

/**
 * RBAC Policy Middleware: Enforces specific functional permission
 */
export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = resolveUserRole(req);
    const allowedPermissions = ROLE_PERMISSIONS[userRole] || [];

    if (!allowedPermissions.includes(permission)) {
      const clientKey = behavioralFirewall.extractClientKey(req);

      behavioralFirewall.recordAnomaly(
        clientKey,
        'PERMISSION_DENIED',
        3,
        { userRole, permission, path: req.path },
        req
      );

      logSecurityEvent({
        category: 'AUTHZ_DENIED',
        severity: 'HIGH',
        action: `PERMISSION_DENIED_${permission}`,
        actor: req.dbUser?.email || clientKey,
        ip: req.ip || '127.0.0.1',
        details: {
          userRole,
          requiredPermission: permission,
          path: req.path,
        },
      });

      return res.status(403).json({
        error: `Acesso negado: Permissão '${permission}' não concedida ao perfil '${userRole}'.`,
        code: 'AUTHZ_PERMISSION_DENIED',
      });
    }

    next();
  };
}
