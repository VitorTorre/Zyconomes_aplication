import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deepSanitizeInput, verifyResourceOwnership, Schemas } from '../src/middleware/securityGateway.ts';
import { behavioralFirewall, validateSafeFileUpload } from '../src/middleware/behavioralFirewall.ts';
import { circuitBreaker, IMMUTABLE_RELEASE_SNAPSHOT } from '../src/lib/circuitBreaker.ts';
import { securityPlaneService } from '../src/services/securityPlane.ts';
import { logSecurityEvent, generateServerHmac, clearSecurityLogsForTesting, getSecurityLogs } from '../src/lib/securityAudit.ts';

describe('Layer 1: Input & Action Security Gateway', () => {
  it('deepSanitizeInput strips prototype pollution and dangerous script tags', () => {
    const maliciousPayload = {
      name: 'João <script>alert("xss")</script> Silva',
      nested: {
        danger: 'javascript:void(0)',
        clean: 'Texto limpo',
      },
      __proto__: { admin: true },
      constructor: { hacked: true },
    };

    const sanitized = deepSanitizeInput(maliciousPayload);

    expect(sanitized.name).toBe('João  Silva');
    expect(sanitized.nested.danger).toBe('void(0)');
    expect(sanitized.nested.clean).toBe('Texto limpo');
    expect((sanitized as any).__proto__.admin).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(sanitized, '__proto__')).toBe(false);
  });

  it('Schemas.saveSimulation strictly validates and rejects unauthorized extra keys', () => {
    const validData = {
      toolId: 'valuation-dcf',
      name: 'Simulação Conservadora',
      data: { discountRate: 10, growthRate: 3 },
    };

    const result = Schemas.saveSimulation.safeParse(validData);
    expect(result.success).toBe(true);

    const invalidExtraData = {
      ...validData,
      unauthorizedField: 'malicious_injection',
    };

    const failedResult = Schemas.saveSimulation.safeParse(invalidExtraData);
    expect(failedResult.success).toBe(false);
  });

  it('verifyResourceOwnership blocks IDOR attempts and triggers security response', () => {
    const mockReq: any = {
      headers: {},
      socket: { remoteAddress: '192.168.1.100' },
      path: '/api/simulations/42',
    };

    let statusCalled = 0;
    let jsonCalledWith: any = null;

    const mockRes: any = {
      status: (code: number) => {
        statusCalled = code;
        return mockRes;
      },
      json: (data: any) => {
        jsonCalledWith = data;
        return mockRes;
      },
    };

    // Usuário 99 tentando acessar recurso do Usuário 42
    const allowed = verifyResourceOwnership(42, 99, mockReq, mockRes);

    expect(allowed).toBe(false);
    expect(statusCalled).toBe(403);
    expect(jsonCalledWith.code).toBe('AUTHZ_IDOR_VIOLATION');
  });
});

describe('Layer 2: Behavioral Firewall & Rapid Containment (<500ms)', () => {
  beforeEach(() => {
    behavioralFirewall.resetForTesting();
    clearSecurityLogsForTesting();
  });

  it('accumulates anomaly points and engages rapid quarantine when threshold is breached', () => {
    const clientKey = 'ip:198.51.100.25';

    // 1st violation (weight 3) -> score 3, not quarantined
    const step1 = behavioralFirewall.recordAnomaly(clientKey, 'SCHEMA_VIOLATION', 3, { field: 'test' });
    expect(step1.quarantined).toBe(false);
    expect(behavioralFirewall.isQuarantined(clientKey)).toBe(false);

    // 2nd violation (weight 5 - ex: IDOR attempt) -> score 8 >= threshold 7 -> QUARANTINE!
    const step2 = behavioralFirewall.recordAnomaly(clientKey, 'IDOR_ATTEMPT', 5, { target: 123 });
    expect(step2.quarantined).toBe(true);
    expect(step2.score).toBe(8);
    expect(behavioralFirewall.isQuarantined(clientKey)).toBe(true);

    // Verifies entity metadata
    const active = behavioralFirewall.getQuarantinedEntities();
    expect(active.length).toBe(1);
    expect(active[0].key).toBe(clientKey);
    expect(active[0].anomalyScore).toBe(8);
  });

  it('circuit breaker falls back to Immutable Release A snapshot during external dependency failures', () => {
    // Registra falhas consecutivas no serviço stripe
    for (let i = 0; i < 3; i++) {
      circuitBreaker.recordFailure('stripe', 'Connection reset by peer');
    }

    const stripeStatus = circuitBreaker.getCircuitStatus('stripe');
    expect(stripeStatus.state).toBe('OPEN');

    const release = circuitBreaker.getImmutableRelease();
    expect(release.version).toBe('2026.1.0-releaseA');
    expect(release.buildHash).toBe('0x03c0640-immutable-baseline');
    expect(release.status).toBe('OPERATIONAL_BASELINE');
  });

  it('validateSafeFileUpload enforces maximum file size and authentic signatures', () => {
    // Fake buffer sem assinatura PDF
    const fakeBuffer = Buffer.from('Not a real pdf');
    const resultInvalid = validateSafeFileUpload(fakeBuffer, 'application/pdf', 'relatorio.pdf');
    expect(resultInvalid.safe).toBe(false);
    expect(resultInvalid.error).toContain('Assinatura binária incompatível');

    // Buffer com cabeçalho PDF autêntico
    const validPdfBuffer = Buffer.from('%PDF-1.7 Test document content...');
    const resultValid = validateSafeFileUpload(validPdfBuffer, 'application/pdf', 'relatorio final../2026.pdf');
    expect(resultValid.safe).toBe(true);
    expect(resultValid.sanitizedFilename).toBe('relatorio_final._2026.pdf');
  });
});

describe('Layer 3: Super Admin Security Plane & Telemetry', () => {
  beforeEach(() => {
    clearSecurityLogsForTesting();
  });

  it('evaluates health across 8 core subsystems including Security and CI/CD', async () => {
    const health = await securityPlaneService.checkSubsystemsHealth();

    expect(health.frontend).toBeDefined();
    expect(health.frontend.status).toBe('HEALTHY');

    expect(health.api).toBeDefined();
    expect(health.api.status).toBe('HEALTHY');

    expect(health.database).toBeDefined();
    expect(health.auth).toBeDefined();
    expect(health.payments).toBeDefined();
    expect(health.webhooks).toBeDefined();

    expect(health.security).toBeDefined();
    expect(health.security.status).toBe('MONITORING');

    expect(health.cicd).toBeDefined();
    expect(health.cicd.status).toBe('HEALTHY');
    expect(health.cicd.details).toContain('Release A Imutável');
  });

  it('requires step-up challenge before elevating administrative privileges', () => {
    // Senha errada
    const failure = securityPlaneService.verifyStepUp('wrong_pass', 'admin@zyconomes.com');
    expect(failure.success).toBe(false);
    expect(failure.error).toContain('inválida');

    // Senha de elevação válida
    const success = securityPlaneService.verifyStepUp('zyconomes-superadmin-2026', 'admin@zyconomes.com');
    expect(success.success).toBe(true);
    expect(success.elevatedToken).toMatch(/^elevated_/);
    expect(securityPlaneService.isElevated(success.elevatedToken!)).toBe(true);
  });

  it('produces cryptographically signed security audit logs with HMAC SHA-256', () => {
    const log = logSecurityEvent({
      category: 'PRIVILEGED_ACTION',
      severity: 'HIGH',
      action: 'TEST_SUPERADMIN_ACTION',
      actor: 'superadmin_1',
      details: { reason: 'nist_audit' },
    });

    expect(log.serverHmac).toBeDefined();
    expect(log.serverHmac.length).toBe(64); // SHA-256 hex length

    const logs = getSecurityLogs(10);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].action).toBe('TEST_SUPERADMIN_ACTION');
  });
});
