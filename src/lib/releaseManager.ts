import { logSecurityEvent } from './securityAudit.ts';
import { circuitBreaker, IMMUTABLE_RELEASE_SNAPSHOT } from './circuitBreaker.ts';

export interface ReleaseManifest {
  releaseId: string;
  name: string;
  version: string;
  buildHash: string;
  deployedAt: string;
  isKnownGoodBaseline: boolean;
  status: 'ACTIVE' | 'STANDBY' | 'QUARANTINED' | 'ROLLED_BACK';
  metadata: Record<string, any>;
}

export interface RollbackExecutionResult {
  success: boolean;
  routeSwitchDurationMs: number; // Target ≤ 500ms
  previousReleaseId: string;
  activeReleaseId: string;
  activeRelease: ReleaseManifest;
  actor: string;
  reason: string;
  rtoTargetMet: boolean;
}

class ReleaseManager {
  private currentRelease: ReleaseManifest = {
    releaseId: 'RELEASE_N',
    name: 'Produção Principal (Live)',
    version: '2026.2.0-main',
    buildHash: '0x8f3b19c-current-prod',
    deployedAt: '2026-09-20T12:00:00Z',
    isKnownGoodBaseline: false,
    status: 'ACTIVE',
    metadata: {
      framework: 'Express + Vite React',
      environment: 'production',
      features: ['advanced_valuation', 'ai_rebalance', 'security_gateway'],
    },
  };

  private knownGoodRelease: ReleaseManifest = {
    releaseId: 'RELEASE_N_MINUS_1',
    name: 'Known-Good Release A (Baseline Imutável)',
    version: IMMUTABLE_RELEASE_SNAPSHOT.version,
    buildHash: IMMUTABLE_RELEASE_SNAPSHOT.buildHash,
    deployedAt: '2026-09-20T00:00:00Z',
    isKnownGoodBaseline: true,
    status: 'STANDBY',
    metadata: {
      framework: 'Express Static Fallback Engine',
      environment: 'immutable_baseline',
      features: ['core_math', 'offline_safe', 'resilient_simulations'],
    },
  };

  private activeReleaseId: 'RELEASE_N' | 'RELEASE_N_MINUS_1' = 'RELEASE_N';
  private lastRouteSwitchMs: number = 0;

  public getActiveRelease(): ReleaseManifest {
    return this.activeReleaseId === 'RELEASE_N' ? this.currentRelease : this.knownGoodRelease;
  }

  public getReleases(): { active: ReleaseManifest; current: ReleaseManifest; knownGood: ReleaseManifest; lastSwitchMs: number } {
    return {
      active: this.getActiveRelease(),
      current: this.currentRelease,
      knownGood: this.knownGoodRelease,
      lastSwitchMs: this.lastRouteSwitchMs,
    };
  }

  /**
   * Sub-500ms Containment & Instant Route Switch.
   * Switches execution pipeline to Known-Good Release N-1 in memory without slow disk mutation.
   */
  public triggerInstantRollback(reason: string, actor: string): RollbackExecutionResult {
    const startTime = performance.now();
    const previousReleaseId = this.activeReleaseId;

    // 1. Quarentena o Release N
    this.currentRelease.status = 'QUARANTINED';

    // 2. Comuta imediatamente para o Known-Good Release A (N-1)
    this.knownGoodRelease.status = 'ACTIVE';
    this.activeReleaseId = 'RELEASE_N_MINUS_1';

    // 3. Força abertura protetiva do Circuit Breaker em subsistemas degradados
    circuitBreaker.forceState('database', 'OPEN', actor);
    circuitBreaker.forceState('stripe', 'OPEN', actor);

    const routeSwitchDurationMs = Number((performance.now() - startTime).toFixed(3));
    this.lastRouteSwitchMs = routeSwitchDurationMs;
    const rtoTargetMet = routeSwitchDurationMs <= 500;

    // 4. Emite log de auditoria append-only imutável no ledger
    logSecurityEvent({
      category: 'SECURITY_CONTAINMENT',
      severity: 'CRITICAL',
      action: 'INSTANT_ROLLBACK_ROUTE_SWITCH',
      actor,
      details: {
        reason,
        fromRelease: previousReleaseId,
        toRelease: this.activeReleaseId,
        routeSwitchDurationMs,
        rtoTargetMet,
        targetBaselineHash: this.knownGoodRelease.buildHash,
      },
    });

    return {
      success: true,
      routeSwitchDurationMs,
      previousReleaseId,
      activeReleaseId: this.activeReleaseId,
      activeRelease: this.knownGoodRelease,
      actor,
      reason,
      rtoTargetMet,
    };
  }

  /**
   * Restaura o tráfego para a Release N principal após validação/reparo
   */
  public restorePrimaryRelease(actor: string): { success: boolean; activeReleaseId: string } {
    this.currentRelease.status = 'ACTIVE';
    this.knownGoodRelease.status = 'STANDBY';
    this.activeReleaseId = 'RELEASE_N';

    circuitBreaker.forceState('database', 'CLOSED', actor);
    circuitBreaker.forceState('stripe', 'CLOSED', actor);

    logSecurityEvent({
      category: 'PRIVILEGED_ACTION',
      severity: 'HIGH',
      action: 'PRIMARY_RELEASE_RESTORED',
      actor,
      details: {
        releaseId: 'RELEASE_N',
        version: this.currentRelease.version,
      },
    });

    return { success: true, activeReleaseId: 'RELEASE_N' };
  }
}

export const releaseManager = new ReleaseManager();
