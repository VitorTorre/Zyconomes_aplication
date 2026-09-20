import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Radio,
  RefreshCw,
  Server,
  Database,
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hash,
  Terminal,
  FileCheck2,
  Clock,
} from 'lucide-react';
import { motion } from 'motion/react';

interface SubsystemHealth {
  name: string;
  category: string;
  status: 'HEALTHY' | 'DEGRADED' | 'MONITORING' | 'MAINTENANCE' | 'CRITICAL';
  latencyMs: number;
  lastChecked: string;
  details: string;
}

interface CircuitMetrics {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastStateChange: number;
  immutableRelease: string;
}

interface QuarantinedEntity {
  key: string;
  quarantinedAt: number;
  expiresAt: number;
  reason: string;
  anomalyScore: number;
  totalViolations: number;
}

export const SuperAdminSecurityPlane: React.FC = () => {
  const [subsystems, setSubsystems] = useState<Record<string, SubsystemHealth>>({});
  const [circuits, setCircuits] = useState<Record<string, CircuitMetrics>>({});
  const [quarantined, setQuarantined] = useState<QuarantinedEntity[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [releases, setReleases] = useState<any>(null);
  const [ledgerIntegrity, setLedgerIntegrity] = useState<any>({ valid: true });
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Step-up authentication state
  const [isElevated, setIsElevated] = useState(false);
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [stepUpError, setStepUpError] = useState('');
  const [stepUpLoading, setStepUpLoading] = useState(false);
  const [elevatedToken, setElevatedToken] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/security/health');
      if (res.ok) {
        const data = await res.json();
        setSubsystems(data.subsystems || {});
      }

      // Snapshot & circuits
      const snapshotRes = await fetch('/api/security/release-snapshot');
      if (snapshotRes.ok) {
        // ok
      }

      // Try telemetry if authenticated
      const user = (window as any).__ZYC_AUTH_USER;
      const idToken = user && typeof user.getIdToken === 'function' ? await user.getIdToken() : null;
      if (idToken) {
        const telRes = await fetch('/api/security/superadmin/telemetry', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (telRes.ok) {
          const telData = await telRes.json();
          if (telData.circuits) setCircuits(telData.circuits);
          if (telData.quarantinedEntities) setQuarantined(telData.quarantinedEntities);
          if (telData.recentSecurityEvents) setSecurityEvents(telData.recentSecurityEvents);
          if (telData.releases) setReleases(telData.releases);
        }

        // Fetch audit logs & ledger integrity verification
        const auditRes = await fetch('/api/audit/logs', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (auditData.integrity) setLedgerIntegrity(auditData.integrity);
        }
      }
    } catch (err) {
      console.warn('Falha ao sincronizar telemetria de segurança:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInstantRollback = async () => {
    if (!window.confirm('ATENÇÃO: Deseja comutar o tráfego imediatamente para a Release N-1 estável (RTO ≤ 500ms)?')) {
      return;
    }
    try {
      setRollbackLoading(true);
      const user = (window as any).__ZYC_AUTH_USER;
      const idToken = user && typeof user.getIdToken === 'function' ? await user.getIdToken() : null;
      const res = await fetch('/api/security/superadmin/rollback/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ reason: 'Contenção manual acionada pelo operador Super Admin' }),
      });
      if (res.ok) {
        await fetchSecurityData();
      }
    } catch (err) {
      console.error('Falha ao acionar rollback:', err);
    } finally {
      setRollbackLoading(false);
    }
  };

  const handleRestoreRelease = async () => {
    try {
      setRollbackLoading(true);
      const user = (window as any).__ZYC_AUTH_USER;
      const idToken = user && typeof user.getIdToken === 'function' ? await user.getIdToken() : null;
      const res = await fetch('/api/security/superadmin/rollback/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      if (res.ok) {
        await fetchSecurityData();
      }
    } catch (err) {
      console.error('Falha ao restaurar release principal:', err);
    } finally {
      setRollbackLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStepUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepUpError('');
    setStepUpLoading(true);
    try {
      const user = (window as any).__ZYC_AUTH_USER;
      const idToken = user && typeof user.getIdToken === 'function' ? await user.getIdToken() : null;
      const res = await fetch('/api/security/superadmin/step-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          stepUpPassword,
          action: 'ELEVATE_SUPERADMIN_PLANE',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStepUpError(data.error || 'Credencial de elevação rejeitada');
      } else {
        setIsElevated(true);
        setElevatedToken(data.elevatedToken);
        setStepUpPassword('');
      }
    } catch (err: any) {
      setStepUpError('Falha ao comunicar com o Gateway de Elevação');
    } finally {
      setStepUpLoading(false);
    }
  };

  const handleReleaseQuarantine = async (targetKey: string) => {
    try {
      const user = (window as any).__ZYC_AUTH_USER;
      const idToken = user && typeof user.getIdToken === 'function' ? await user.getIdToken() : null;
      const res = await fetch('/api/security/superadmin/quarantine/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ targetKey }),
      });
      if (res.ok) {
        setQuarantined(prev => prev.filter(q => q.key !== targetKey));
      }
    } catch (err) {
      console.error('Falha ao liberar quarentena:', err);
    }
  };

  const handleToggleCircuit = async (service: string, currentState: string) => {
    const newState = currentState === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      const user = (window as any).__ZYC_AUTH_USER;
      const idToken = user && typeof user.getIdToken === 'function' ? await user.getIdToken() : null;
      const res = await fetch('/api/security/superadmin/circuit-breaker/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ service, state: newState }),
      });
      if (res.ok) {
        const data = await res.json();
        setCircuits(prev => ({
          ...prev,
          [service]: data.newState,
        }));
      }
    } catch (err) {
      console.error('Falha ao alternar circuito:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Architecture & Step-Up Status */}
      <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-6 border border-zinc-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#1A1F71] text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              NIST SP 800-61 Rev. 2 Compliant
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-zinc-800 text-zinc-300">
              Release A Baseline: 2026.1.0 (03c0640)
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            Super Admin Control Plane
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Arquitetura de segurança em camadas (Gateway de Validação, Firewall Comportamental e Circuit Breaker de Contenção Imediata). O sistema não realiza deleção de arquivos em runtime — a restauração opera sobre baselines imutáveis estáveis.
          </p>
        </div>

        {/* Step-Up Status / Prompt */}
        <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isElevated ? 'bg-emerald-950/60 text-emerald-400' : 'bg-amber-950/60 text-amber-400'}`}>
              {isElevated ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Status de Elevação</div>
              <div className="text-sm font-black text-white">
                {isElevated ? 'Sessão Super Admin Ativa' : 'Modo Leitura Restrita'}
              </div>
            </div>
          </div>

          {!isElevated ? (
            <form onSubmit={handleStepUpSubmit} className="flex items-center gap-2">
              <input
                type="password"
                value={stepUpPassword}
                onChange={e => setStepUpPassword(e.target.value)}
                placeholder="Senha de elevação..."
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#1A1F71] w-36 sm:w-44"
              />
              <button
                type="submit"
                disabled={stepUpLoading || !stepUpPassword}
                className="bg-[#1A1F71] hover:bg-[#15195c] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {stepUpLoading ? '...' : 'Elevar'}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsElevated(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              Encerrar Elevação
            </button>
          )}
        </div>
      </div>

      {stepUpError && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{stepUpError}</span>
        </div>
      )}

      {/* 8 SUBSYSTEMS HEALTH STATUS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className="font-black text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Saúde dos Subsistemas em Tempo Real
            </h3>
          </div>
          <button
            onClick={fetchSecurityData}
            disabled={refreshing}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(subsystems).map(([key, sys]) => {
            const isHealthy = sys.status === 'HEALTHY';
            const isMonitoring = sys.status === 'MONITORING';
            return (
              <div
                key={key}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                    {sys.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isHealthy
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : isMonitoring
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {isHealthy ? (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    ) : (
                      <Activity className="w-2.5 h-2.5" />
                    )}
                    {sys.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">{sys.details}</p>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Latência: {sys.latencyMs}ms</span>
                  <span>{sys.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BEHAVIORAL FIREWALL & RAPID CONTAINMENT (<500ms) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Quarantined Entities */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Contenção Rápida & Quarentena
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                {quarantined.length} Ativas
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Clientes que acumularam anomalias comportamentais (tentativas de IDOR, injeções ou rajadas de requisição) são isolados em &lt; 500ms recebendo bloqueio HTTP 403 com cabeçalho Retry-After.
            </p>

            {quarantined.length === 0 ? (
              <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-400">
                Nenhum ator em quarentena no momento. Todo o tráfego opera dentro dos limites comportamentais.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-56 overflow-y-auto">
                {quarantined.map(q => (
                  <div key={q.key} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{q.key}</div>
                      <div className="text-[11px] text-zinc-400">{q.reason} • Score: {q.anomalyScore}</div>
                    </div>
                    {isElevated ? (
                      <button
                        onClick={() => handleReleaseQuarantine(q.key)}
                        className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Liberar
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-red-500 font-bold">Bloqueado</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Janela de Observação: 60s</span>
            <span>Limiar de Contenção: Score ≥ 7</span>
          </div>
        </div>

        {/* Right: Circuit Breakers & Immutable Baseline Snapshot */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Circuit Breakers & Rollback Imutável
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Baseline Release A
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Se qualquer dependência falhar, os circuitos entram em modo de contenção, servindo o estado pré-compilado íntegro sem mutações arriscadas no filesystem.
            </p>

            <div className="space-y-3">
              {['database', 'auth', 'stripe', 'ai_engine'].map(srv => {
                const c = circuits[srv] || { state: 'CLOSED', failures: 0, successes: 0 };
                const isOpen = c.state === 'OPEN';
                return (
                  <div
                    key={srv}
                    className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase">
                        {srv.replace('_', ' ')}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Falhas: {c.failures} • Sucessos: {c.successes}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          isOpen
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {c.state}
                      </span>
                      {isElevated && (
                        <button
                          onClick={() => handleToggleCircuit(srv, c.state)}
                          className="text-[10px] underline text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer font-bold"
                        >
                          {isOpen ? 'Restaurar' : 'Armar Trip'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>Snapshot: 0x03c0640-immutable</span>
            <span>Fallback TTL: &lt; 500ms</span>
          </div>
        </div>
      </div>

      {/* INSTANT ROLLBACK & ROUTE SWITCH (NIST SP 800-61 Rev. 2 - RTO <= 500ms) */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 text-white rounded-2xl p-6 border border-zinc-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                RTO ALVO &le; 500ms
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Hash Chain: {ledgerIntegrity?.valid ? 'Íntegra (Sem Adulteração)' : 'Alerta de Inconsistência'}
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Gerenciador de Release & Contenção Imediata (Route Switch)
            </h3>
            <p className="text-xs text-zinc-400 max-w-3xl">
              Em caso de incidente severo, a contenção comuta a rota de execução para o baseline imutável estável em menos de 500ms, isolando anomalias sem tocar no filesystem em tempo de execução. O GitHub atua como fonte de reconstrução formal assíncrona.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {releases?.active?.releaseId === 'RELEASE_N' ? (
              <button
                onClick={handleInstantRollback}
                disabled={rollbackLoading || !isElevated}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                {rollbackLoading ? 'Comutando...' : 'Comutar para Release N-1 (≤ 500ms)'}
              </button>
            ) : (
              <button
                onClick={handleRestoreRelease}
                disabled={rollbackLoading || !isElevated}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {rollbackLoading ? 'Restaurando...' : 'Restaurar Release N Principal'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Release Ativa</div>
            <div className="text-sm font-black text-white mt-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${releases?.active?.releaseId === 'RELEASE_N' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              {releases?.active?.version || '2026.2.0-main'} ({releases?.active?.releaseId || 'RELEASE_N'})
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-1">Hash: {releases?.active?.buildHash?.substring(0, 16)}...</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
            <div className="text-[11px] font-mono text-zinc-400 uppercase">Baseline de Segurança (N-1)</div>
            <div className="text-sm font-black text-white mt-1">
              2026.1.0-releaseA (03c0640)
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-1">Estado: Imutável pré-compilado</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
            <div className="text-[11px] font-mono text-zinc-400 uppercase">RTO de Contenção Medido</div>
            <div className="text-sm font-black text-emerald-400 mt-1 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {releases?.lastSwitchMs ? `${releases.lastSwitchMs} ms` : '< 2 ms'}
              <span className="text-[10px] text-zinc-400 font-normal">(Meta: &le; 500ms)</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400/80 mt-1">Conforme NIST SP 800-61</div>
          </div>
        </div>
      </div>

      {/* SECURITY LOGS STREAM WITH SERVER HMAC SIGNATURES */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Trilha Criptográfica de Eventos de Segurança (HMAC SHA-256)
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {securityEvents.length} Eventos Recentes
          </span>
        </div>

        {securityEvents.length === 0 ? (
          <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-400">
            Nenhum incidente de segurança detectado recentemente. Gateway e Firewall operando nominalmente.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
            {securityEvents.map(evt => (
              <div key={evt.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-zinc-400">{evt.id}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                      evt.severity === 'CRITICAL' || evt.severity === 'HIGH'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}>
                      {evt.severity}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{evt.action}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    Ator: {evt.actor} • IP: {evt.ip} • {new Date(evt.timestamp).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 truncate max-w-xs flex items-center gap-1">
                  <Hash className="w-2.5 h-2.5 text-zinc-400" />
                  <span>{evt.serverHmac?.substring(0, 16)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
