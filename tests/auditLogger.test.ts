import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auditLogger, AuditEvent } from '../src/lib/auditLogger';

describe('Audit Logger Diagnostic Service Tests', () => {
  beforeEach(() => {
    (global as any).localStorage = {
      store: {} as Record<string, string>,
      getItem: function (key: string) { return this.store[key] || null; },
      setItem: function (key: string, val: string) { this.store[key] = val; },
      removeItem: function (key: string) { delete this.store[key]; },
    };
    (global as any).window = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    // Mock fetch for background server sync
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('records an audit event with deterministic checksum and required fields', () => {
    const event = auditLogger.recordAuditEvent({
      category: 'SECURITY',
      severity: 'WARN',
      action: 'FAILED_TOKEN_ATTEMPT',
      actor: 'system_test',
      details: { reason: 'malformed_jwt_structure' },
    });

    expect(event).toBeDefined();
    expect(event.id).toMatch(/^zyc-aud-/);
    expect(event.category).toBe('SECURITY');
    expect(event.severity).toBe('WARN');
    expect(event.action).toBe('FAILED_TOKEN_ATTEMPT');
    expect(event.checksum).toMatch(/^0x[0-9a-f]+/i);
    expect(event.timestamp).toBeDefined();
  });

  it('filters audit events by category and severity', () => {
    auditLogger.recordAuditEvent({ category: 'SECURITY', severity: 'ERROR', action: 'SEC_ERR_1' });
    auditLogger.recordAuditEvent({ category: 'PAYMENT', severity: 'INFO', action: 'PAY_INFO_1' });
    auditLogger.recordAuditEvent({ category: 'SECURITY', severity: 'INFO', action: 'SEC_INFO_2' });

    const securityLogs = auditLogger.getAuditTrail({ category: 'SECURITY' });
    expect(securityLogs.every(l => l.category === 'SECURITY')).toBe(true);

    const errorLogs = auditLogger.getAuditTrail({ severity: 'ERROR' });
    expect(errorLogs.some(l => l.severity === 'ERROR')).toBe(true);
  });

  it('computes audit statistics accurately', () => {
    auditLogger.recordAuditEvent({ category: 'PAYMENT', severity: 'CRITICAL', action: 'CHARGEBACK_RISK' });
    const stats = auditLogger.getAuditStats();

    expect(stats).toHaveProperty('totalEvents');
    expect(stats).toHaveProperty('bySeverity');
    expect(stats.bySeverity.CRITICAL).toBeGreaterThanOrEqual(1);
    expect(stats.byCategory.PAYMENT).toBeGreaterThanOrEqual(1);
  });
});
