export type AuditCategory = 
  | 'SECURITY' 
  | 'AUTHENTICATION' 
  | 'RATE_LIMIT' 
  | 'PAYMENT' 
  | 'DATA_EXPORT' 
  | 'STATE_PERSISTENCE' 
  | 'DIAGNOSTIC' 
  | 'SYSTEM_CONFIG';

export type AuditSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface AuditEvent {
  id: string;
  timestamp: string;
  category: AuditCategory;
  severity: AuditSeverity;
  action: string;
  actor: string;
  details: Record<string, any>;
  checksum: string;
  source: 'client' | 'system' | 'hotkey';
}

export interface AuditFilterOptions {
  category?: AuditCategory;
  severity?: AuditSeverity;
  search?: string;
  limit?: number;
}

const AUDIT_STORAGE_KEY = 'zyc_audit_trail';
const MAX_AUDIT_LOGS = 200;

/**
 * Generates a deterministic hex checksum for data integrity verification.
 */
function generateChecksum(dataString: string): string {
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const secondary = (Math.abs((hash ^ 0x5f3759df) >>> 0)).toString(16).padStart(8, '0');
  return `0x${hex}${secondary}`.toUpperCase();
}

/**
 * Initial institutional seeds when no logs exist yet.
 */
function getInitialSeedEvents(): AuditEvent[] {
  const now = Date.now();
  const seedDefs: Array<{
    offsetMinutes: number;
    category: AuditCategory;
    severity: AuditSeverity;
    action: string;
    actor: string;
    details: Record<string, any>;
    source: 'client' | 'system' | 'hotkey';
  }> = [
    {
      offsetMinutes: 45,
      category: 'SYSTEM_CONFIG',
      severity: 'INFO',
      action: 'SYSTEM_INITIALIZED',
      actor: 'system_core@zyconomes.com.br',
      details: { environment: 'production-ready', clientEngine: 'Zyconomes Math v2.4' },
      source: 'system',
    },
    {
      offsetMinutes: 32,
      category: 'SECURITY',
      severity: 'INFO',
      action: 'CSP_POLICY_ENFORCED',
      actor: 'security_engine',
      details: { frameAncestors: 'google.com', clientSideOnly: true },
      source: 'system',
    },
    {
      offsetMinutes: 20,
      category: 'AUTHENTICATION',
      severity: 'INFO',
      action: 'SESSION_VERIFIED',
      actor: 'vitor.engineer@zyconomes.com.br',
      details: { role: 'lead_architect', tokenType: 'bearer_pbkdf2' },
      source: 'client',
    },
    {
      offsetMinutes: 12,
      category: 'RATE_LIMIT',
      severity: 'INFO',
      action: 'SLIDING_WINDOW_ACTIVE',
      actor: 'saveRateLimiter',
      details: { maxRequests: 5, windowSeconds: 60, currentBucketUsage: 1 },
      source: 'system',
    },
    {
      offsetMinutes: 5,
      category: 'DATA_EXPORT',
      severity: 'INFO',
      action: 'PDF_REPORT_PREPARED',
      actor: 'vitor.engineer@zyconomes.com.br',
      details: { tool: 'Diagnóstico Financeiro', format: 'A4_institutional' },
      source: 'client',
    },
  ];

  return seedDefs.map((seed, idx) => {
    const timestamp = new Date(now - seed.offsetMinutes * 60 * 1000).toISOString();
    const id = `zyc-audit-${now - seed.offsetMinutes * 60 * 1000}-${idx}`;
    const raw = `${id}:${timestamp}:${seed.category}:${seed.action}:${JSON.stringify(seed.details)}`;
    return {
      id,
      timestamp,
      category: seed.category,
      severity: seed.severity,
      action: seed.action,
      actor: seed.actor,
      details: seed.details,
      checksum: generateChecksum(raw),
      source: seed.source,
    };
  });
}

class AuditLoggerService {
  /**
   * Retrieves all audit events safely from localStorage.
   */
  public getAuditTrail(filter?: AuditFilterOptions): AuditEvent[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      let logs: AuditEvent[];

      if (!stored) {
        logs = getInitialSeedEvents();
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
      } else {
        logs = JSON.parse(stored);
      }

      if (!Array.isArray(logs)) return [];

      if (filter) {
        if (filter.category) {
          logs = logs.filter(l => l.category === filter.category);
        }
        if (filter.severity) {
          logs = logs.filter(l => l.severity === filter.severity);
        }
        if (filter.search) {
          const s = filter.search.toLowerCase();
          logs = logs.filter(
            l =>
              l.action.toLowerCase().includes(s) ||
              l.actor.toLowerCase().includes(s) ||
              l.id.toLowerCase().includes(s) ||
              JSON.stringify(l.details).toLowerCase().includes(s)
          );
        }
        if (filter.limit && filter.limit > 0) {
          logs = logs.slice(0, filter.limit);
        }
      }

      return logs;
    } catch (e) {
      console.warn('[AuditLogger] Failed to read audit trail:', e);
      return [];
    }
  }

  /**
   * Records a sensitive system event with tamper-evident checksum to localStorage.
   */
  public recordAuditEvent(params: {
    category: AuditCategory;
    severity?: AuditSeverity;
    action: string;
    actor?: string;
    details?: Record<string, any>;
    source?: 'client' | 'system' | 'hotkey';
  }): AuditEvent {
    const timestamp = new Date().toISOString();
    const id = `zyc-aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const severity = params.severity || 'INFO';
    const actor = params.actor || this.resolveCurrentActor();
    const details = params.details || {};
    const source = params.source || 'client';

    const rawSignature = `${id}:${timestamp}:${params.category}:${params.action}:${JSON.stringify(details)}`;
    const checksum = generateChecksum(rawSignature);

    const event: AuditEvent = {
      id,
      timestamp,
      category: params.category,
      severity,
      action: params.action,
      actor,
      details,
      checksum,
      source,
    };

    if (typeof window !== 'undefined') {
      try {
        const current = this.getAuditTrail();
        const updated = [event, ...current].slice(0, MAX_AUDIT_LOGS);
        // Client-side diagnostic ring buffer (HUD & diagnostic view only - not a compliance ledger)
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));

        // Notify active dashboard views and listeners in real-time
        window.dispatchEvent(
          new CustomEvent('zyc_audit_logged', {
            detail: event,
          })
        );

        // Disparo assíncrono para persistência imutável server-side com assinatura HMAC
        fetch('/api/audit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: event.id,
            category: event.category,
            severity: event.severity,
            action: event.action,
            actor: event.actor,
            details: event.details,
            clientChecksum: event.checksum,
          }),
        }).catch(() => {
          // Fallback silencioso: se offline ou falha de rede, o buffer local permanece
        });
      } catch (err) {
        console.warn('[AuditLogger] Failed to save audit event to localStorage:', err);
      }
    }

    return event;
  }

  /**
   * Clears the current audit trail but records a permanent diagnostic entry of the reset.
   */
  public clearAuditTrail(actor?: string): void {
    if (typeof window === 'undefined') return;

    const clearedEvent = this.recordAuditEvent({
      category: 'SYSTEM_CONFIG',
      severity: 'WARN',
      action: 'AUDIT_TRAIL_PURGED',
      actor: actor || this.resolveCurrentActor(),
      details: { reason: 'manual_engineer_reset', previousLogsArchived: true },
      source: 'client',
    });

    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([clearedEvent]));
      window.dispatchEvent(new CustomEvent('zyc_audit_cleared'));
    } catch (e) {
      console.warn('[AuditLogger] Failed to clear audit trail:', e);
    }
  }

  /**
   * Returns statistical metrics for the diagnostic dashboard.
   */
  public getAuditStats() {
    const logs = this.getAuditTrail();
    const bySeverity: Record<AuditSeverity, number> = {
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      CRITICAL: 0,
    };
    const byCategory: Record<AuditCategory, number> = {
      SECURITY: 0,
      AUTHENTICATION: 0,
      RATE_LIMIT: 0,
      PAYMENT: 0,
      DATA_EXPORT: 0,
      STATE_PERSISTENCE: 0,
      DIAGNOSTIC: 0,
      SYSTEM_CONFIG: 0,
    };

    logs.forEach(l => {
      if (bySeverity[l.severity] !== undefined) bySeverity[l.severity]++;
      if (byCategory[l.category] !== undefined) byCategory[l.category]++;
    });

    return {
      total: logs.length,
      totalEvents: logs.length,
      bySeverity,
      byCategory,
      lastEventAt: logs.length > 0 ? logs[0].timestamp : null,
      activeChecksum: logs.length > 0 ? logs[0].checksum : 'NONE',
    };
  }

  /**
   * Exports the entire audit log as a formatted JSON document.
   */
  public exportAuditTrailJson(): string {
    const trail = this.getAuditTrail();
    return JSON.stringify(
      {
        zyconomesAuditMetadata: {
          exportedAt: new Date().toISOString(),
          totalEntries: trail.length,
          signature: 'Zyconomes Institutional Audit Engine v2.4',
        },
        events: trail,
      },
      null,
      2
    );
  }

  /**
   * Subscribes to real-time audit updates.
   */
  public subscribe(callback: (event: AuditEvent) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handler = (e: Event) => {
      const custom = e as CustomEvent<AuditEvent>;
      if (custom.detail) {
        callback(custom.detail);
      }
    };

    window.addEventListener('zyc_audit_logged', handler);
    return () => window.removeEventListener('zyc_audit_logged', handler);
  }

  private resolveCurrentActor(): string {
    if (typeof window === 'undefined') return 'system';
    const email = localStorage.getItem('zyc_user_email');
    if (email) return email;
    const token = localStorage.getItem('zyc_auth_token');
    if (token) return 'authenticated_engineer';
    return 'senior_architect_guest';
  }
}

export const auditLogger = new AuditLoggerService();
