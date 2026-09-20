import { logSecurityEvent } from './securityAudit.ts';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ServiceCircuitConfig {
  failureThreshold: number; // consecutive failures before trip
  recoveryTimeoutMs: number; // cooldown before half-open probe
}

export interface CircuitMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastStateChange: number;
  immutableRelease: string;
}

// Release A: Pre-built, immutable fallback baseline for sub-500ms containment
export const IMMUTABLE_RELEASE_SNAPSHOT = {
  version: '2026.1.0-releaseA',
  buildHash: '0x03c0640-immutable-baseline',
  timestamp: '2026-09-20T00:00:00Z',
  status: 'OPERATIONAL_BASELINE',
  fallbackDiagnostic: {
    freeCashFlow: 0,
    savingsRate: 0,
    statusText: 'Cálculo executado no baseline de segurança resiliente local.',
    offlineSafe: true,
  }
};

class CircuitBreakerService {
  private circuits: Map<string, {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number | null;
    lastStateChange: number;
    config: ServiceCircuitConfig;
  }> = new Map();

  private defaultFallbackRelease = IMMUTABLE_RELEASE_SNAPSHOT;

  constructor() {
    // Registra circuitos dos principais subsistemas
    this.registerService('database', { failureThreshold: 5, recoveryTimeoutMs: 15000 });
    this.registerService('auth', { failureThreshold: 5, recoveryTimeoutMs: 10000 });
    this.registerService('stripe', { failureThreshold: 3, recoveryTimeoutMs: 30000 });
    this.registerService('ai_engine', { failureThreshold: 4, recoveryTimeoutMs: 20000 });
  }

  public registerService(name: string, config: ServiceCircuitConfig) {
    this.circuits.set(name, {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastStateChange: Date.now(),
      config,
    });
  }

  public getCircuitStatus(name: string): CircuitMetrics {
    const circuit = this.circuits.get(name);
    if (!circuit) {
      return {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailureTime: null,
        lastStateChange: Date.now(),
        immutableRelease: this.defaultFallbackRelease.version,
      };
    }

    // Auto half-open check based on recoveryTimeoutMs
    if (circuit.state === 'OPEN' && circuit.lastFailureTime) {
      if (Date.now() - circuit.lastFailureTime > circuit.config.recoveryTimeoutMs) {
        circuit.state = 'HALF_OPEN';
        circuit.lastStateChange = Date.now();
      }
    }

    return {
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
      lastFailureTime: circuit.lastFailureTime,
      lastStateChange: circuit.lastStateChange,
      immutableRelease: this.defaultFallbackRelease.version,
    };
  }

  public getAllCircuits(): Record<string, CircuitMetrics> {
    const result: Record<string, CircuitMetrics> = {};
    for (const [name] of this.circuits.entries()) {
      result[name] = this.getCircuitStatus(name);
    }
    return result;
  }

  public recordSuccess(serviceName: string): void {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return;

    if (circuit.state === 'HALF_OPEN') {
      circuit.successes++;
      if (circuit.successes >= 3) {
        circuit.state = 'CLOSED';
        circuit.failures = 0;
        circuit.successes = 0;
        circuit.lastStateChange = Date.now();
        logSecurityEvent({
          category: 'CIRCUIT_BREAKER_TRIPPED',
          severity: 'LOW',
          action: `CIRCUIT_RESTORED_${serviceName.toUpperCase()}`,
          details: { service: serviceName, state: 'CLOSED' },
        });
      }
    } else if (circuit.state === 'CLOSED') {
      circuit.failures = 0;
    }
  }

  public recordFailure(serviceName: string, reason: string): void {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return;

    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === 'HALF_OPEN' || circuit.failures >= circuit.config.failureThreshold) {
      const prevState = circuit.state;
      circuit.state = 'OPEN';
      circuit.lastStateChange = Date.now();
      logSecurityEvent({
        category: 'CIRCUIT_BREAKER_TRIPPED',
        severity: 'HIGH',
        action: `CIRCUIT_TRIPPED_${serviceName.toUpperCase()}`,
        details: { service: serviceName, prevState, failures: circuit.failures, reason },
      });
    }
  }

  public forceState(serviceName: string, state: CircuitState, actor: string): void {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) return;

    circuit.state = state;
    circuit.lastStateChange = Date.now();
    if (state === 'CLOSED') {
      circuit.failures = 0;
      circuit.successes = 0;
    }

    logSecurityEvent({
      category: 'PRIVILEGED_ACTION',
      severity: 'HIGH',
      action: `CIRCUIT_MANUAL_OVERRIDE_${serviceName.toUpperCase()}`,
      actor,
      details: { service: serviceName, targetState: state },
    });
  }

  public getImmutableRelease() {
    return this.defaultFallbackRelease;
  }
}

export const circuitBreaker = new CircuitBreakerService();
