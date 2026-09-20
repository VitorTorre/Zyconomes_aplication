export type SpiralIterationId = 'spiral-1' | 'spiral-2' | 'spiral-3' | 'spiral-4';

export interface SpiralIteration {
  id: SpiralIterationId;
  loopNumber: number;
  title: string;
  tagline: string;
  phase: 'Especificação' | 'Desenvolvimento' | 'Validação' | 'Concluído';
  specification: {
    objectives: string[];
    userStories: string[];
    riskAnalysis: string;
    acceptedCriteria: string[];
  };
  development: {
    artifacts: string[];
    componentsBuilt: string[];
    codeSnippets: { filename: string; language: string; code: string }[];
  };
  validation: {
    tests: { name: string; type: 'unit' | 'integration' | 'load'; passed: boolean; metric: string }[];
    benchmarkResult: string;
    auditStatus: 'Aprovado' | 'Em Validação' | 'Reprovado';
  };
}

export interface UserRegistrationPayload {
  email: string;
  nome_completo: string;
  cpf: string;
  senha_plana: string;
}

export interface StoredUser {
  id: string;
  email: string;
  nome_completo: string;
  cpf_anonimizado: string;
  senha_hash_pbkdf2: string;
  status: 'PENDENTE_OTP' | 'ATIVO' | 'BLOQUEADO';
  created_at: string;
  correlation_id: string;
}

export interface QueueMessage {
  id: string;
  correlation_id: string;
  idempotency_key: string;
  event_type: 'UsuarioCadastrado' | 'DispararOTP' | 'OrdemExecutada';
  payload: {
    user_id: string;
    email: string;
    nome: string;
    timestamp: string;
  };
  attempts: number;
  max_attempts: number;
  enqueued_at: string;
  status: 'QUEUED' | 'PROCESSING' | 'ACKNOWLEDGED' | 'DEAD_LETTERED';
}

export interface DeadLetterMessage extends QueueMessage {
  failed_at: string;
  error_reason: string;
  stack_trace_snippet: string;
}

export interface SystemMetrics {
  tps?: number;
  current_rps: number;
  peak_rps: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  active_pg_connections: number;
  pgbouncer_client_connections: number;
  pgbouncer_pool_size: number;
  redis_locks_active: number;
  redis_conflicts_prevented: number;
  rabbitmq_queue_depth: number;
  dlq_depth: number;
  total_processed: number;
  success_rate: number;
  worker_circuit_state: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
  worker_circuit_failures: number;
  worker_circuit_cooldown: number;
  db_circuit_state: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
  db_circuit_failures: number;
  db_circuit_cooldown: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  correlation_id: string;
  service: 'API_GATEWAY' | 'PGBOUNCER' | 'REDIS_LOCK' | 'RABBITMQ' | 'WORKER_EMAIL';
  event_name: string;
  details: Record<string, any>;
}

export interface RequirementItem {
  code: string;
  type: 'RF' | 'RNF';
  title: string;
  description: string;
  targetMetric: string;
  verificationMethod: string;
  spiralIteration: SpiralIterationId;
  status: 'Atendido' | 'Em Teste' | 'Pendente';
}
