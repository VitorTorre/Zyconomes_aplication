import React, { useState, useEffect } from 'react';
import { 
  SystemMetrics, 
  LogEntry, 
  UserRegistrationPayload, 
  StoredUser, 
  QueueMessage, 
  DeadLetterMessage 
} from '../types/zyconomes';
import { 
  Play, 
  Flame, 
  ShieldAlert, 
  Database, 
  Lock, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Zap, 
  Cpu, 
  Radio, 
  Copy, 
  Check, 
  Trash2,
  Activity
} from 'lucide-react';

import { ConcurrencyImpactChart } from './ConcurrencyImpactChart';
import { CircuitBreakerPanel } from './CircuitBreakerPanel';
import { OtpSimulatorPanel } from './OtpSimulatorPanel';
import { PgBouncerDashboard } from './PgBouncerDashboard';

interface Props {
  metrics: SystemMetrics;
  logs: LogEntry[];
  users: StoredUser[];
  queueMessages: QueueMessage[];
  deadLetters: DeadLetterMessage[];
  onRegisterUser: (payload: UserRegistrationPayload) => { success: boolean; message: string; correlationId?: string; isDuplicate?: boolean };
  onRunStressBurst: (concurrency: number) => void;
  onClearLogs: () => void;
  onToggleSmtpFailure: (enabled: boolean) => void;
  isSmtpFailureInjected: boolean;
  onReprocessDlq: () => void;
}

type UserRole = 'desenvolvedor' | 'superadmin' | 'admin' | 'super-user' | 'user';

export const LiveSimulator: React.FC<Props> = ({
  metrics,
  logs,
  users,
  queueMessages,
  deadLetters,
  onRegisterUser,
  onRunStressBurst,
  onClearLogs,
  onToggleSmtpFailure,
  isSmtpFailureInjected,
  onReprocessDlq
}) => {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('desenvolvedor');
  const [email, setEmail] = useState('investidor@zyconomes.com.br');
  const [nome, setNome] = useState('Fernando Henrique Siqueira');
  const [cpf, setCpf] = useState('123.456.789-00');
  const [senha, setSenha] = useState('ZycoProdPass#2026');
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'conflict' | 'error'; text: string; correlationId?: string } | null>(null);
  const [isBurstRunning, setIsBurstRunning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>('ALL');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onRegisterUser({
      email,
      nome_completo: nome,
      cpf,
      senha_plana: senha
    });

    if (result.success) {
      setFormFeedback({
        type: 'success',
        text: `Usuário cadastrado com sucesso! Retorno em 24ms via PgBouncer Pool. Evento publicado no RabbitMQ.`,
        correlationId: result.correlationId
      });
    } else if (result.isDuplicate) {
      setFormFeedback({
        type: 'conflict',
        text: `[HTTP 409 CONFLICT] Redis SETNX interceptou requisição duplicada em 1.8ms! Lock ativo para "${email}". Zero impacto no Postgres.`,
        correlationId: result.correlationId
      });
    } else {
      setFormFeedback({
        type: 'error',
        text: `Erro no processamento: ${result.message}`,
        correlationId: result.correlationId
      });
    }
  };

  const handleBurst = (targetRps: number) => {
    setIsBurstRunning(true);
    onRunStressBurst(targetRps);
    setTimeout(() => {
      setIsBurstRunning(false);
    }, 1500);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'ALL') return true;
    return l.service === logFilter;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* RBAC Header */}
      <div className="bg-[#0A0A0A] border border-[#222] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3 h-3 text-purple-500" />
          <h3 className="font-bold text-[10px] text-zinc-200 uppercase tracking-widest">SysAdmin Control Console</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest">AUTH CONTEXT:</span>
          <select 
            value={currentUserRole}
            onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
            className="bg-black border border-[#333] text-purple-500 text-[9px] font-bold px-2 py-1 uppercase tracking-widest focus:outline-none focus:border-purple-500"
          >
            <option value="desenvolvedor">SYS_DEV (ROOT)</option>
            <option value="superadmin">SUPER_ADMIN (TIER 1)</option>
            <option value="super-user">SUPER_USER (TIER 2)</option>
            <option value="admin">ADMIN (SERVICE PROVIDER)</option>
            <option value="user">USER (GUEST/CLIENT)</option>
          </select>
        </div>
      </div>

      {currentUserRole !== 'user' && (
        <div className="mb-6">
          <ConcurrencyImpactChart />
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="border border-[#222] bg-[#0A0A0A] p-3">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">LIVE THROUGHPUT</div>
          <div className="text-xl font-mono font-bold text-amber-500 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {metrics.current_rps.toLocaleString()} <span className="text-[9px] text-zinc-600 tracking-widest">RPS</span>
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">Peak: {metrics.peak_rps} RPS</div>
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-3">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">LATENCY P95</div>
          <div className="text-xl font-mono font-bold text-emerald-500 mt-1">
            {metrics.p95_latency_ms} <span className="text-[9px] text-zinc-600 tracking-widest">MS</span>
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">P50: {metrics.p50_latency_ms}MS | P99: {metrics.p99_latency_ms}MS</div>
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-3">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">PGBOUNCER POOL</div>
          <div className="text-xl font-mono font-bold text-blue-500 mt-1">
            {metrics.pgbouncer_client_connections} <span className="text-[9px] text-zinc-600 tracking-widest">CONNS</span>
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">Physical: <strong className="text-emerald-500">{metrics.active_pg_connections}/100</strong></div>
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-3">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">REDIS IDEMPOTENCY</div>
          <div className="text-xl font-mono font-bold text-purple-500 mt-1">
            {metrics.redis_conflicts_prevented}
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">Collisions Blocked</div>
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-3">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">RABBITMQ DEPTH</div>
          <div className="text-xl font-mono font-bold text-amber-500 mt-1">
            {metrics.rabbitmq_queue_depth} <span className="text-[9px] text-zinc-600 tracking-widest">MSGS</span>
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">Drain Rate: 1.2K/S</div>
        </div>

        <div className="border border-[#222] bg-[#0A0A0A] p-3">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">DEAD LETTER QUEUE</div>
          <div className={`text-xl font-mono font-bold mt-1 ${metrics.dlq_depth > 0 ? 'text-red-500' : 'text-zinc-600'}`}>
            {metrics.dlq_depth} <span className="text-[9px] text-zinc-600 tracking-widest">ERRORS</span>
          </div>
          <div className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">DLX Isolation Active</div>
        </div>
      </div>

      <CircuitBreakerPanel metrics={metrics} />

      {/* Main Interactive Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono">
        {/* Left Form: Ingestão de Teste & Duplicação */}
        <div className="lg:col-span-6 space-y-4">
          <div className="border border-[#222] bg-[#0A0A0A] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-widest">
                <Send className="w-3 h-3" />
                <span>HTTP Ingestion Simulator & Idempotency Check</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">POST /api/cadastro</span>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-[10px]">
              <div>
                <label className="font-bold text-zinc-500 uppercase tracking-widest block mb-1">Investor Email (Idempotency Key)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] px-3 py-2 text-zinc-200 focus:border-amber-500 focus:outline-none uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-500 uppercase tracking-widest block mb-1">Legal Name</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] px-3 py-2 text-zinc-200 focus:border-amber-500 focus:outline-none uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-500 uppercase tracking-widest block mb-1">Tax ID (Sanitized)</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] px-3 py-2 text-zinc-200 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-500 uppercase tracking-widest block mb-1">Plain Password (PBKDF2 Hashed)</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] px-3 py-2 text-zinc-200 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2 font-bold transition-colors cursor-pointer uppercase tracking-widest"
                >
                  EXECUTE POST
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Instantly trigger duplicate with same email
                    onRegisterUser({ email, nome_completo: nome, cpf, senha_plana: senha });
                  }}
                  className="px-3 py-2 bg-black hover:bg-[#111] text-purple-500 border border-purple-500/30 font-bold transition-colors cursor-pointer uppercase tracking-widest"
                  title="Testar duplo clique com mesma chave"
                >
                  SIMULATE DUPLICATE
                </button>
              </div>
            </form>

            {/* Feedback Box */}
            {formFeedback && (
              <div className={`p-3 border text-[9px] uppercase tracking-widest leading-relaxed ${
                formFeedback.type === 'success' 
                  ? 'bg-[#111] border-emerald-500/50 text-emerald-500' 
                  : formFeedback.type === 'conflict'
                  ? 'bg-[#111] border-purple-500/50 text-purple-500'
                  : 'bg-[#111] border-red-500/50 text-red-500'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {formFeedback.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {formFeedback.type === 'success' ? 'SYSTEM: PERSISTED & DISPATCHED' : formFeedback.type === 'conflict' ? 'SYSTEM: IDEMPOTENCY LOCK ACTIVE' : 'SYSTEM: FAILURE'}
                </div>
                <div>{formFeedback.text}</div>
                {formFeedback.correlationId && (
                  <div className="text-[9px] font-mono text-zinc-600 mt-1">
                    x-correlation-id: <span className="text-zinc-400">{formFeedback.correlationId}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stress & Fault Injection Panel */}
          <div className="border border-[#222] bg-[#0A0A0A] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#222] pb-2">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-[10px] uppercase tracking-widest">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Concurrent Load & Fault Injection</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">K6 Engine</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleBurst(500)}
                disabled={isBurstRunning}
                className="p-2 bg-[#111] hover:bg-[#222] border border-[#333] text-center transition-colors cursor-pointer"
              >
                <div className="font-bold text-[11px] text-zinc-200">500 RPS</div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">MED LOAD</div>
              </button>

              <button
                onClick={() => handleBurst(2000)}
                disabled={isBurstRunning}
                className="p-2 bg-[#111] hover:bg-[#222] border border-[#333] text-center transition-colors cursor-pointer"
              >
                <div className="font-bold text-[11px] text-amber-500">2,000 RPS</div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">HIGH PEAK</div>
              </button>

              <button
                onClick={() => handleBurst(5000)}
                disabled={isBurstRunning}
                className="p-2 bg-black hover:bg-[#111] border border-amber-500/50 text-center transition-colors cursor-pointer"
              >
                <div className="font-bold text-[11px] text-amber-500">5,000 RPS</div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">MAX STRESS</div>
              </button>
            </div>

            {/* SMTP Fault Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#111] border border-[#333] mt-2">
              <div>
                <div className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest">Inject SMTP Gateway Fault</div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Forces 3 retries & routes to DLQ</div>
              </div>
              <button
                onClick={() => onToggleSmtpFailure(!isSmtpFailureInjected)}
                className={`px-3 py-1.5 text-[9px] font-bold transition-colors cursor-pointer uppercase tracking-widest ${
                  isSmtpFailureInjected 
                    ? 'bg-red-500 text-black border border-red-500' 
                    : 'bg-black text-zinc-500 border border-[#333] hover:text-zinc-200'
                }`}
              >
                {isSmtpFailureInjected ? 'FAULT ACTIVE' : 'NORMAL'}
              </button>
            </div>

            {metrics.dlq_depth > 0 && (
              <div className="flex items-center justify-between p-3 bg-black border border-red-500/50">
                <div className="text-[10px] text-red-500 uppercase tracking-widest font-bold">
                  {metrics.dlq_depth} MSGS IN DEAD LETTER QUEUE
                </div>
                <button
                  onClick={onReprocessDlq}
                  className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-[9px] font-bold transition-colors cursor-pointer uppercase tracking-widest"
                >
                  Reprocessar DLQ
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-4">
          <OtpSimulatorPanel />
          <PgBouncerDashboard metrics={metrics} />
          
          {/* Right: Live Structured Logs */}
          <div className="border border-[#222] bg-[#0A0A0A] shadow-lg h-[460px] flex flex-col font-mono">
            <div className="px-4 py-3 bg-black border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest">
                  STDOUT JSON LOGS (END-TO-END TRACE)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-[#111] border border-[#333] text-[9px] px-2 py-1 text-zinc-300 focus:outline-none uppercase tracking-widest"
                >
                  <option value="ALL">ALL SERVICES</option>
                  <option value="API_GATEWAY">API GATEWAY</option>
                  <option value="REDIS_LOCK">REDIS LOCK</option>
                  <option value="PGBOUNCER">PGBOUNCER POOL</option>
                  <option value="RABBITMQ">RABBITMQ BROKER</option>
                  <option value="WORKER_EMAIL">EMAIL WORKER</option>
                </select>
                <button
                  onClick={onClearLogs}
                  className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                  title="Clear Logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#0A0A0A] text-[10px] text-zinc-300 flex-1 overflow-y-auto max-h-[460px] space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-zinc-600 text-center py-12 uppercase tracking-widest">
                  Awaiting events... Execute POST or run load test.
                </div>
              ) : (
                filteredLogs.slice(-25).reverse().map((log) => {
                  const isError = log.level === 'ERROR';
                  const isWarn = log.level === 'WARN';
                  return (
                    <div
                      key={log.id}
                      className={`p-2 border transition-all ${
                        isError 
                          ? 'border-red-500/40 bg-[#111] text-red-500' 
                          : isWarn 
                          ? 'border-amber-500/30 bg-[#111] text-amber-500' 
                          : 'border-[#333] bg-black text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase tracking-widest mb-1">
                        <span className="font-bold text-amber-500">[{log.service}]</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="font-bold text-zinc-200 mb-0.5 uppercase tracking-widest">{log.event_name}</div>
                      <div className="text-[9px] text-zinc-500">
                        X-CORRELATION-ID: <span className="text-zinc-400">{log.correlation_id}</span>
                      </div>
                      <pre className="text-[9px] text-zinc-500 mt-1.5 overflow-x-auto bg-[#111] p-2 border border-[#222]">
                        {JSON.stringify(log.details)}
                      </pre>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Users & Queue Message Inspect Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
        {/* Users Table */}
        <div className="border border-[#222] bg-[#0A0A0A] overflow-hidden">
          <div className="px-4 py-3 bg-black border-b border-[#222] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest">
                POSTGRESQL: USERS ({users.length} RECORDS)
              </span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-left text-[9px] font-mono">
              <thead className="bg-[#111] text-zinc-500 uppercase tracking-widest border-b border-[#222]">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Password (PBKDF2 Hash)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222] bg-black">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-zinc-600 uppercase tracking-widest">No users registered.</td>
                  </tr>
                ) : (
                  users.slice(-8).reverse().map((u) => (
                    <tr key={u.id} className="hover:bg-[#111]">
                      <td className="p-3 text-amber-500">{u.email}</td>
                      <td className="p-3 text-zinc-300 uppercase">{u.nome_completo}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 bg-[#111] text-amber-500 border border-amber-500/30 uppercase tracking-widest">
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-600 truncate max-w-[120px]">{u.senha_hash_pbkdf2}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
