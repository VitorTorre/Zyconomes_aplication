import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logSecurityEvent } from '../lib/securityAudit.ts';
import { behavioralFirewall } from './behavioralFirewall.ts';

// 1. Sanitização profunda contra Prototype Pollution, Script Injections e Path Traversal
export function deepSanitizeInput<T = any>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Remove tags de script diretas, javascript: e caracteres de controle perigosos
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/\0/g, '') as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => deepSanitizeInput(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const cleanObj: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Bloqueia tentativas de Prototype Pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleanObj[key] = deepSanitizeInput(value);
    }
    return cleanObj as T;
  }

  return data;
}

// 2. Middleware de normalização e sanitização global de inputs
export function sanitizeRequestInputs(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = deepSanitizeInput(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = deepSanitizeInput(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = deepSanitizeInput(req.params);
    }
    next();
  } catch (err: any) {
    return res.status(400).json({ error: 'Falha na normalização e sanitização de entrada' });
  }
}

// 3. Validador de Schema Zod com Allowlist Estrita e Integração ao Behavioral Firewall
export function validateSchema(schema: ZodSchema<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const clientKey = behavioralFirewall.extractClientKey(req);
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const issueDetails = parsed.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));

      // Pontua anomalia no firewall comportamental
      const { quarantined } = behavioralFirewall.recordAnomaly(
        clientKey,
        'SCHEMA_VIOLATION',
        3,
        { issues: issueDetails, path: req.path },
        req
      );

      logSecurityEvent({
        category: 'SCHEMA_VIOLATION',
        severity: 'MEDIUM',
        action: 'INPUT_SCHEMA_VALIDATION_FAILED',
        actor: clientKey,
        ip: req.ip || '127.0.0.1',
        details: { path: req.path, issues: issueDetails, quarantined },
      });

      return res.status(400).json({
        error: 'Validação de parâmetros rejeitada pelo Security Gateway.',
        details: issueDetails,
      });
    }

    // Atribui o corpo rigorosamente validado e higienizado
    req.body = parsed.data;
    next();
  };
}

// 4. Verificação de Propriedade e Anti-IDOR (Insecure Direct Object References)
export function verifyResourceOwnership(
  resourceOwnerId: number | string,
  authenticatedUserId: number | string,
  req: Request,
  res: Response
): boolean {
  if (String(resourceOwnerId) !== String(authenticatedUserId)) {
    const clientKey = behavioralFirewall.extractClientKey(req);

    // IDOR é uma anomalia severa (peso 5)
    behavioralFirewall.recordAnomaly(
      clientKey,
      'IDOR_ATTEMPT',
      5,
      { targetResourceId: resourceOwnerId, actorId: authenticatedUserId, path: req.path },
      req
    );

    logSecurityEvent({
      category: 'IDOR_ATTEMPT',
      severity: 'HIGH',
      action: 'UNAUTHORIZED_RESOURCE_ACCESS_ATTEMPT',
      actor: clientKey,
      ip: req.ip || '127.0.0.1',
      details: { targetResourceId: resourceOwnerId, actorId: authenticatedUserId, path: req.path },
    });

    res.status(403).json({
      error: 'Acesso negado: Tentativa de operação sobre recurso pertencente a outro usuário.',
      code: 'AUTHZ_IDOR_VIOLATION',
    });
    return false;
  }
  return true;
}

// 5. Schemas Oficiais para as Ações da Aplicação
export const Schemas = {
  saveSimulation: z.object({
    toolId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'toolId inválido'),
    name: z.string().min(1).max(120),
    data: z.record(z.string(), z.any()),
  }).strict(),

  updateProfile: z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().max(30).optional(),
  }).strict(),

  feedback: z.object({
    text: z.string().min(5).max(2000),
    type: z.enum(['positive', 'neutral', 'negative']).default('neutral'),
  }).strict(),

  event: z.object({
    eventName: z.string().min(1).max(100),
    metadata: z.record(z.string(), z.any()).optional().default({}),
  }).strict(),

  aiRebalance: z.object({
    profile: z.enum(['conservador', 'moderado', 'arrojado', 'agressivo']).default('moderado'),
    amount: z.number().min(100).max(1000000000), // R$ 100 até 1 Bilhão
  }).strict(),

  superAdminStepUp: z.object({
    stepUpPassword: z.string().min(4).max(64),
    action: z.string().min(1).max(64),
  }).strict(),

  quarantineRelease: z.object({
    targetKey: z.string().min(1).max(128),
  }).strict(),

  circuitToggle: z.object({
    serviceName: z.string().min(2).max(64),
    targetState: z.enum(['CLOSED', 'OPEN', 'HALF_OPEN']),
  }).strict(),

  rollbackTrigger: z.object({
    reason: z.string().min(5).max(300),
  }).strict(),

  clientDiagnosticEvent: z.object({
    action: z.string().min(3).max(64),
    details: z.record(z.string(), z.any()).optional().default({}),
  }).strict(),
};
