import crypto from 'crypto';

export type SecurityEventCategory =
  | 'AUTH_FAILURE'
  | 'AUTHZ_DENIED'
  | 'IDOR_ATTEMPT'
  | 'SCHEMA_VIOLATION'
  | 'INJECTION_BLOCKED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ANOMALY_DETECTED'
  | 'QUARANTINE_TRIGGERED'
  | 'CIRCUIT_BREAKER_TRIPPED'
  | 'STEP_UP_VERIFIED'
  | 'PRIVILEGED_ACTION'
  | 'AUTHORIZED_MUTATION'
  | 'SECURITY_CONTAINMENT'
  | 'CLIENT_DIAGNOSTIC';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface StructuredSecurityLog {
  index: number;
  id: string;
  timestamp: string;
  category: SecurityEventCategory;
  severity: SecuritySeverity;
  action: string;
  actor: string;
  ip: string;
  details: Record<string, any>;
  prevHash: string;
  entryHash: string;
  serverHmac: string;
}

// Zero hardcoded secrets: Use environment secret or cryptographically secure runtime random in dev/test
const AUDIT_HMAC_SECRET: string = process.env.AUDIT_HMAC_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: AUDIT_HMAC_SECRET must be defined in production environment.');
  }
  const globalStore = globalThis as any;
  if (!globalStore.__zyco_runtime_audit_secret) {
    globalStore.__zyco_runtime_audit_secret = crypto.randomBytes(32).toString('hex');
  }
  return globalStore.__zyco_runtime_audit_secret;
})();

const GENESIS_PREV_HASH = '0'.repeat(64);

// Append-only ledger in-memory array (authoritative server source)
const securityLedger: StructuredSecurityLog[] = [];
const MAX_SECURITY_LEDGER_ENTRIES = 2000;

export function getAuditSecret(): string {
  return AUDIT_HMAC_SECRET;
}

export function generateServerHmac(payload: string): string {
  return crypto.createHmac('sha256', AUDIT_HMAC_SECRET).update(payload).digest('hex');
}

export function computeEntryHash(
  index: number,
  id: string,
  timestamp: string,
  prevHash: string,
  category: string,
  action: string,
  actor: string,
  ip: string,
  details: Record<string, any>
): string {
  const payload = `${index}:${id}:${timestamp}:${prevHash}:${category}:${action}:${actor}:${ip}:${JSON.stringify(details)}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Server-Authoritative append-only log entry.
 * Implements cryptographic hash chaining: each entry is bound to the hash of the preceding entry.
 */
export function logSecurityEvent(params: {
  category: SecurityEventCategory;
  severity: SecuritySeverity;
  action: string;
  actor?: string;
  ip?: string;
  details?: Record<string, any>;
}): StructuredSecurityLog {
  const timestamp = new Date().toISOString();
  const id = `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const actor = params.actor || 'system';
  const ip = params.ip || '127.0.0.1';
  const details = params.details || {};

  const index = securityLedger.length;
  const prevHash = index === 0 ? GENESIS_PREV_HASH : securityLedger[index - 1].entryHash;

  const entryHash = computeEntryHash(
    index,
    id,
    timestamp,
    prevHash,
    params.category,
    params.action,
    actor,
    ip,
    details
  );

  const serverHmac = generateServerHmac(entryHash);

  const logEntry: StructuredSecurityLog = {
    index,
    id,
    timestamp,
    category: params.category,
    severity: params.severity,
    action: params.action,
    actor,
    ip,
    details,
    prevHash,
    entryHash,
    serverHmac,
  };

  securityLedger.push(logEntry);

  if (securityLedger.length > MAX_SECURITY_LEDGER_ENTRIES) {
    // Keep ledger bounded in memory while preserving latest window
    securityLedger.shift();
  }

  // Structured stdout for SIEM / Cloud Logging
  console.warn(JSON.stringify({
    level: 'SECURITY_EVENT',
    index: logEntry.index,
    id: logEntry.id,
    category: logEntry.category,
    severity: logEntry.severity,
    action: logEntry.action,
    actor: logEntry.actor,
    ip: logEntry.ip,
    timestamp: logEntry.timestamp,
    prevHash: logEntry.prevHash,
    entryHash: logEntry.entryHash,
    serverHmac: logEntry.serverHmac,
    details: logEntry.details
  }));

  return logEntry;
}

/**
 * Verifies cryptographic integrity of the hash chain.
 * Returns true only if every link from genesis to head is untampered.
 */
export function verifyLedgerIntegrity(): { valid: boolean; totalEntries: number; tamperedIndex?: number; reason?: string } {
  for (let i = 0; i < securityLedger.length; i++) {
    const entry = securityLedger[i];
    const expectedPrevHash = i === 0 ? GENESIS_PREV_HASH : securityLedger[i - 1].entryHash;

    if (entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalEntries: securityLedger.length,
        tamperedIndex: i,
        reason: `Previous hash mismatch at index ${i}`,
      };
    }

    const calculatedHash = computeEntryHash(
      entry.index,
      entry.id,
      entry.timestamp,
      entry.prevHash,
      entry.category,
      entry.action,
      entry.actor,
      entry.ip,
      entry.details
    );

    if (calculatedHash !== entry.entryHash) {
      return {
        valid: false,
        totalEntries: securityLedger.length,
        tamperedIndex: i,
        reason: `Entry hash corrupted at index ${i}`,
      };
    }

    const calculatedHmac = generateServerHmac(entry.entryHash);
    if (calculatedHmac !== entry.serverHmac) {
      return {
        valid: false,
        totalEntries: securityLedger.length,
        tamperedIndex: i,
        reason: `HMAC signature invalid at index ${i}`,
      };
    }
  }

  return { valid: true, totalEntries: securityLedger.length };
}

export function getSecurityLogs(limit = 100): StructuredSecurityLog[] {
  return [...securityLedger].reverse().slice(0, limit);
}

export function clearSecurityLogsForTesting(): void {
  securityLedger.length = 0;
}
