import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent, SecuritySeverity } from '../lib/securityAudit.ts';

export interface AnomalyRecord {
  timestamp: number;
  type: string;
  weight: number;
  details: any;
}

export interface QuarantinedEntity {
  key: string;
  quarantinedAt: number;
  expiresAt: number;
  reason: string;
  anomalyScore: number;
  totalViolations: number;
}

class BehavioralFirewallService {
  private anomalyWindowMs = 60 * 1000; // 60 segundos
  private quarantineDurationMs = 5 * 60 * 1000; // 5 minutos de quarentena
  private quarantineThresholdScore = 7; // Pontuação acumulada para acionar quarentena (< 500ms)

  // Map de chave (IP ou userId) para lista de anomalias recentes
  private anomaliesMap = new Map<string, AnomalyRecord[]>();

  // Map de entidades atualmente em quarentena ativa
  private quarantineMap = new Map<string, QuarantinedEntity>();

  public extractClientKey(req: Request): string {
    const userId = (req as any).dbUser?.id || (req as any).user?.uid;
    if (userId) return `usr:${userId}`;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    return `ip:${Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim()}`;
  }

  public recordAnomaly(
    key: string,
    type: string,
    weight: number,
    details: any,
    req?: Request
  ): { quarantined: boolean; score: number } {
    const now = Date.now();

    // Limpa registros mais antigos que a janela de observação
    const records = (this.anomaliesMap.get(key) || []).filter(
      r => now - r.timestamp < this.anomalyWindowMs
    );

    records.push({ timestamp: now, type, weight, details });
    this.anomaliesMap.set(key, records);

    const totalScore = records.reduce((sum, r) => sum + r.weight, 0);

    // Avalia se atingiu o limiar de contenção rápida
    if (totalScore >= this.quarantineThresholdScore) {
      this.quarantineEntity(key, `Limiar de anomalia excedido (Score: ${totalScore})`, totalScore);
      logSecurityEvent({
        category: 'QUARANTINE_TRIGGERED',
        severity: 'CRITICAL',
        action: 'CONTAINMENT_QUARANTINE_ENGAGED',
        actor: key,
        ip: req ? (this.extractClientKey(req).replace(/^ip:/, '')) : '127.0.0.1',
        details: { key, score: totalScore, violations: records.length, type },
      });
      return { quarantined: true, score: totalScore };
    }

    logSecurityEvent({
      category: 'ANOMALY_DETECTED',
      severity: weight >= 5 ? 'HIGH' : 'MEDIUM',
      action: `BEHAVIORAL_ANOMALY_${type.toUpperCase()}`,
      actor: key,
      details: { key, score: totalScore, weight, type, details },
    });

    return { quarantined: false, score: totalScore };
  }

  public isQuarantined(key: string): boolean {
    const entity = this.quarantineMap.get(key);
    if (!entity) return false;

    if (Date.now() > entity.expiresAt) {
      this.quarantineMap.delete(key);
      logSecurityEvent({
        category: 'QUARANTINE_TRIGGERED',
        severity: 'LOW',
        action: 'QUARANTINE_AUTO_EXPIRED',
        actor: key,
        details: { key },
      });
      return false;
    }

    return true;
  }

  public quarantineEntity(key: string, reason: string, score = 10, durationMs?: number): QuarantinedEntity {
    const now = Date.now();
    const duration = durationMs || this.quarantineDurationMs;
    const entity: QuarantinedEntity = {
      key,
      quarantinedAt: now,
      expiresAt: now + duration,
      reason,
      anomalyScore: score,
      totalViolations: (this.anomaliesMap.get(key) || []).length,
    };
    this.quarantineMap.set(key, entity);
    return entity;
  }

  public releaseFromQuarantine(key: string, actor: string): boolean {
    const existed = this.quarantineMap.delete(key);
    this.anomaliesMap.delete(key);
    if (existed) {
      logSecurityEvent({
        category: 'PRIVILEGED_ACTION',
        severity: 'HIGH',
        action: 'MANUAL_QUARANTINE_RELEASE',
        actor,
        details: { releasedKey: key },
      });
    }
    return existed;
  }

  public getQuarantinedEntities(): QuarantinedEntity[] {
    const now = Date.now();
    const active: QuarantinedEntity[] = [];
    for (const [key, entity] of this.quarantineMap.entries()) {
      if (now <= entity.expiresAt) {
        active.push(entity);
      } else {
        this.quarantineMap.delete(key);
      }
    }
    return active;
  }

  public getBehavioralStats() {
    return {
      activeQuarantines: this.getQuarantinedEntities().length,
      monitoredKeys: this.anomaliesMap.size,
      quarantineThresholdScore: this.quarantineThresholdScore,
      quarantineDurationSeconds: this.quarantineDurationMs / 1000,
    };
  }

  public resetForTesting(): void {
    this.anomaliesMap.clear();
    this.quarantineMap.clear();
  }
}

export const behavioralFirewall = new BehavioralFirewallService();

/**
 * Middleware Express que bloqueia em < 500ms qualquer cliente em quarentena ativa
 */
export function behavioralFirewallMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientKey = behavioralFirewall.extractClientKey(req);

  if (behavioralFirewall.isQuarantined(clientKey)) {
    const entity = behavioralFirewall.getQuarantinedEntities().find(e => e.key === clientKey);
    const retryAfter = entity ? Math.max(1, Math.ceil((entity.expiresAt - Date.now()) / 1000)) : 300;

    res.setHeader('Retry-After', retryAfter.toString());
    res.setHeader('X-Security-Containment', 'active');

    return res.status(403).json({
      error: 'Acesso temporariamente restrito pelo Behavioral Firewall de Segurança da Zyconomes.',
      code: 'CONTAINMENT_QUARANTINE_ENGAGED',
      retryAfterSeconds: retryAfter,
    });
  }

  next();
}

/**
 * Pipeline seguro de validação de arquivos (OWASP File Upload Cheat Sheet)
 */
export function validateSafeFileUpload(fileBuffer: Buffer, declaredMimeType: string, filename: string): {
  safe: boolean;
  error?: string;
  sanitizedFilename: string;
} {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'application/json', 'text/csv'];

  if (fileBuffer.length > MAX_FILE_SIZE) {
    return { safe: false, error: 'Tamanho excede o limite máximo permitido de 5MB', sanitizedFilename: '' };
  }

  if (!ALLOWED_MIME_TYPES.includes(declaredMimeType)) {
    return { safe: false, error: `Tipo de mídia [${declaredMimeType}] não autorizado`, sanitizedFilename: '' };
  }

  // Sanitização de nome de arquivo (anti path traversal & control characters)
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.+/g, '.');

  // Magic Bytes Check básico
  if (declaredMimeType === 'application/pdf') {
    const header = fileBuffer.slice(0, 4).toString();
    if (header !== '%PDF') {
      return { safe: false, error: 'Assinatura binária incompatível com formato PDF autêntico', sanitizedFilename };
    }
  }

  return { safe: true, sanitizedFilename };
}
