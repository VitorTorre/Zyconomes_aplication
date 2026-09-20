import { 
  SpiralIteration, 
  RequirementItem, 
  UserRegistrationPayload, 
  StoredUser, 
  QueueMessage, 
  DeadLetterMessage, 
  SystemMetrics, 
  LogEntry 
} from '../types/zyconomes';

export const INITIAL_SPIRAL_ITERATIONS: SpiralIteration[] = [
  {
    id: 'spiral-1',
    loopNumber: 1,
    title: 'Ciclo 1: Fundação, Variáveis & Ingestão Segura',
    tagline: 'Configuração externa, isolamento de credenciais e Correlation-ID obrigatório',
    phase: 'Concluído',
    specification: {
      objectives: [
        'Eliminar 100% de credenciais hardcoded no repositório.',
        'Padronizar injeção de x-correlation-id em todas as requisições HTTP de entrada.',
        'Estabelecer formato único de logs estruturados JSON para stdout.'
      ],
      userStories: [
        'Como DevOps, quero configurar banco e mensageria via .env para garantir portabilidade entre Staging e Produção.',
        'Como SRE, quero que toda requisição possua um Correlation-ID para rastrear falhas sem consultar 4 sistemas diferentes.'
      ],
      riskAnalysis: 'Risco de quebra de inicialização por ausência de variáveis obrigatórias. Mitigado por fail-fast schema validator no boot da aplicação.',
      acceptedCriteria: [
        '.env.example versionado com documentação de cada variável.',
        'Middleware de Correlation-ID injeta cabeçalho na resposta e no contexto da requisição.',
        'Zero credenciais em código estático.'
      ]
    },
    development: {
      artifacts: [
        '/.env.example',
        '/src/config/environment.ts',
        '/src/middlewares/correlation.ts',
        '/src/utils/structuredLogger.ts'
      ],
      componentsBuilt: [
        'ConfigValidator (Zod / Joi Schema check)',
        'CorrelationMiddleware (UUIDv4 injector)',
        'StdoutJsonLogger'
      ],
      codeSnippets: [
        {
          filename: 'environment.ts',
          language: 'typescript',
          code: `import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://127.0.0.1:5672',
  JWT_SECRET: process.env.JWT_SECRET!
};`
        }
      ]
    },
    validation: {
      tests: [
        { name: 'Validação de .env no Boot', type: 'unit', passed: true, metric: 'Fail-fast < 5ms' },
        { name: 'Injeção de x-correlation-id', type: 'integration', passed: true, metric: '100% das rotas' },
        { name: 'Saída JSON sem perda de campos', type: 'unit', passed: true, metric: 'Validação de Schema' }
      ],
      benchmarkResult: 'Boot limpo em 18ms. Cobertura de rastreabilidade: 100% das requisições com UUID válido.',
      auditStatus: 'Aprovado'
    }
  },
  {
    id: 'spiral-2',
    loopNumber: 2,
    title: 'Ciclo 2: Idempotência Transacional & Pool com PgBouncer',
    tagline: 'Garantia de não-duplicação via Redis SETNX e multiplexação de conexões',
    phase: 'Concluído',
    specification: {
      objectives: [
        'Prevenir duplicações de cadastro em duplo-clique ou retentativas de rede.',
        'Limitar conexões ativas no PostgreSQL a 100 enquanto atende até 5.000 clientes concorrentes no PgBouncer.',
        'Versionar DDL de banco através de migrations rastreáveis.'
      ],
      userStories: [
        'Como investidor, quero ter certeza de que meu cadastro não criará duas contas nem disparará dois e-mails se minha rede oscilar.',
        'Como arquiteto, quero garantir que um pico de 5k RPS não derrube a memória RAM do banco com milhares de forks de processo.'
      ],
      riskAnalysis: 'Deadlocks no Redis ou timeout de fila no PgBouncer sob concorrência extrema. Mitigado por TTL de 300s no SETNX e transaction-level pooling.',
      acceptedCriteria: [
        'Redis SETNX retorna 409 Conflict em requisições concorrentes com mesma chave.',
        'PgBouncer mantém pool saturado abaixo de 90 conexões no Postgres em picos de 5.000 RPS.',
        'Migrations versionadas rodam antes da subida dos contêineres da aplicação.'
      ]
    },
    development: {
      artifacts: [
        '/src/services/idempotency.ts',
        '/src/database/pgbouncerPool.ts',
        '/migrations/001_create_users.sql',
        '/migrations/002_create_indexes.sql'
      ],
      componentsBuilt: [
        'RedisIdempotencyGuard (SETNX lock manager com expiração atômica)',
        'PgBouncerPoolManager (Multiplexador transacional)',
        'MigrationRunner (Controle de versões de schema)'
      ],
      codeSnippets: [
        {
          filename: 'idempotencyGuard.ts',
          language: 'typescript',
          code: `export async function acquireIdempotencyLock(redis: any, key: string, ttlSeconds = 300): Promise<boolean> {
  const result = await redis.set(\`idemp:\${key}\`, 'LOCKED', 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}`
        }
      ]
    },
    validation: {
      tests: [
        { name: 'Bloqueio de Duplicidade de Cadastro', type: 'integration', passed: true, metric: '0 duplicatas em 1.000 requisições simultâneas' },
        { name: 'Multiplexação PgBouncer (5k clientes -> 100 conexões)', type: 'load', passed: true, metric: 'Max conexões DB = 84' },
        { name: 'Rollback & Forward de Migrations', type: 'integration', passed: true, metric: '100% idempotente' }
      ],
      benchmarkResult: 'Throughput estabilizado em 5.200 RPS. Latência P95 do banco: 12ms (via pool PgBouncer).',
      auditStatus: 'Aprovado'
    }
  },
  {
    id: 'spiral-3',
    loopNumber: 3,
    title: 'Ciclo 3: Mensageria Assíncrona & Worker com DLQ',
    tagline: 'Desacoplamento de envio de e-mails/OTP com Dead Letter Queue resiliente',
    phase: 'Concluído',
    specification: {
      objectives: [
        'Separar a persistência síncrona do usuário (<35ms) do envio de e-mails/OTP assíncrono.',
        'Implementar Dead Letter Exchange (DLX) e Dead Letter Queue (DLQ) para isolar mensagens venenosas.',
        'Garantir política de retentativas exponenciais com limite máximo de 3 tentativas antes do descarte para DLQ.'
      ],
      userStories: [
        'Como usuário, quero receber resposta instantânea de sucesso no formulário enquanto o e-mail é processado em segundo plano.',
        'Como operador, quero inspecionar mensagens com erro na DLQ sem parar a fila principal de e-mails.'
      ],
      riskAnalysis: 'Falha intermitente no provedor SMTP travando a fila de e-mails. Mitigado por circuit breaker e envio para DLQ após 3 falhas.',
      acceptedCriteria: [
        'API Core publica no RabbitMQ em < 5ms e responde 201 Created.',
        'Worker consome em batch controlado com prefetch=50.',
        'Mensagens com erro persistente caem na DLQ com metadados de stack trace.'
      ]
    },
    development: {
      artifacts: [
        '/src/queue/rabbitProducer.ts',
        '/src/queue/emailWorker.ts',
        '/src/queue/deadLetterHandler.ts',
        '/src/services/otpGenerator.ts'
      ],
      componentsBuilt: [
        'RabbitMQExchangeManager (Direct + DLX bindings)',
        'EmailWorkerConsumer (Com auto-ack seguro e backoff)',
        'DeadLetterInspector (Visualizador e reprocessador de falhas)',
        'OTPService (Geração criptográfica segura)'
      ],
      codeSnippets: [
        {
          filename: 'rabbitTopology.ts',
          language: 'typescript',
          code: `await channel.assertExchange('zyconomes_exchange', 'direct', { durable: true });
await channel.assertExchange('zyconomes_dlx', 'direct', { durable: true });

await channel.assertQueue('fila_emails_cadastro', {
  durable: true,
  deadLetterExchange: 'zyconomes_dlx',
  deadLetterRoutingKey: 'emails_dlq_key'
});`
        }
      ]
    },
    validation: {
      tests: [
        { name: 'Desacoplamento Assíncrono API -> Fila', type: 'integration', passed: true, metric: 'Tempo de resposta da API = 28ms' },
        { name: 'Isolamento de Falha para DLQ', type: 'integration', passed: true, metric: '100% das mensagens venenosas capturadas' },
        { name: 'Prefetch & Throughput do Worker', type: 'load', passed: true, metric: '1.200 e-mails/seg com 4 workers' }
      ],
      benchmarkResult: 'Tempo total do endpoint: 26ms. Zero perda de mensagens durante simulação de indisponibilidade de SMTP.',
      auditStatus: 'Aprovado'
    }
  },
  {
    id: 'spiral-4',
    loopNumber: 4,
    title: 'Ciclo 4: Validação de Stress K6, Alta Concorrência & Observabilidade',
    tagline: 'Benchmark a 5.000 RPS, métricas em tempo real e consolidação arquitetural',
    phase: 'Concluído',
    specification: {
      objectives: [
        'Validar resistência contínua sob carga de 5.000 requisições por segundo.',
        'Garantir P95 < 40ms e P99 < 95ms durante picos de concorrência.',
        'Monitorar métricas de saturação de pool, event loop lag e taxa de sucesso em tempo real.'
      ],
      userStories: [
        'Como CTO, quero relatórios claros de testes K6 que comprovem a sustentação de 5k RPS antes do lançamento público.',
        'Como time de suporte, quero métricas de sistema em painel unificado com visualização de saturação de recursos.'
      ],
      riskAnalysis: 'Gargalos no Event Loop do Node.js por processamento síncrono de hash de senhas. Mitigado por PBKDF2 assíncrono com threads dedicadas da libuv.',
      acceptedCriteria: [
        'Sucesso de 99.95% das requisições em teste de stress de 5 minutos.',
        'Event loop lag inferior a 15ms sob carga máxima.',
        'Painel de telemetria emitindo métricas consolidadas.'
      ]
    },
    development: {
      artifacts: [
        '/tests/k6-load-test.js',
        '/src/telemetry/metricsCollector.ts',
        '/src/telemetry/healthCheck.ts',
        '/docker-compose.prod.yml'
      ],
      componentsBuilt: [
        'K6StressTestRunner',
        'SystemMetricsAggregator',
        'HealthProbeController',
        'ProductionTopologyManifest'
      ],
      codeSnippets: [
        {
          filename: 'k6-test.js',
          language: 'javascript',
          code: `import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 1000 },
    { duration: '1m', target: 5000 },
    { duration: '30s', target: 0 }
  ]
};`
        }
      ]
    },
    validation: {
      tests: [
        { name: 'K6 Sustained 5.000 RPS Test', type: 'load', passed: true, metric: '5.120 RPS sustentados' },
        { name: 'P95 Latency Compliance', type: 'load', passed: true, metric: 'P95 = 32.4ms (Meta < 40ms)' },
        { name: 'Zero Memory Leak no Event Loop', type: 'load', passed: true, metric: 'Heap estável em 142MB' }
      ],
      benchmarkResult: 'Certificado de Produção: 5.000 RPS sustentados com P95 de 32.4ms e zero conexões excedidas no PostgreSQL.',
      auditStatus: 'Aprovado'
    }
  }
];

export const REQUIREMENTS_LIST: RequirementItem[] = [
  {
    code: 'RF-01',
    type: 'RF',
    title: 'Cadastro Unificado de Usuário',
    description: 'Recebimento de email, nome_completo, CPF e senha_plana com validação de formato e hashing seguro via PBKDF2.',
    targetMetric: 'Validação e hash em < 8ms',
    verificationMethod: 'Testes de integração com payloads válidos e inválidos',
    spiralIteration: 'spiral-1',
    status: 'Atendido'
  },
  {
    code: 'RF-02',
    type: 'RF',
    title: 'Prevenção de Duplicidade (Idempotência)',
    description: 'Interceptação atômica de requisições idênticas via Redis SETNX com chave idemp:cad:{email} e TTL de 300s.',
    targetMetric: 'Rejeição de duplicatas em < 2ms com HTTP 409',
    verificationMethod: 'Envio simultâneo de 50 requisições idênticas em teste de concorrência',
    spiralIteration: 'spiral-2',
    status: 'Atendido'
  },
  {
    code: 'RF-03',
    type: 'RF',
    title: 'Persistência de Dados de Usuário',
    description: 'Gravação dos dados do usuário na tabela users do PostgreSQL em estado PENDENTE_OTP.',
    targetMetric: 'Tempo de INSERT no banco < 15ms via pool',
    verificationMethod: 'Consulta SQL pós-persistência verificando colunas e constraints',
    spiralIteration: 'spiral-2',
    status: 'Atendido'
  },
  {
    code: 'RF-04',
    type: 'RF',
    title: 'Disparo de Evento UsuarioCadastrado',
    description: 'Publicação assíncrona da mensagem na fila RabbitMQ fila_emails_cadastro com headers de correlation_id.',
    targetMetric: 'Publicação no broker em < 4ms',
    verificationMethod: 'Inspeção de fila com teste de consumo assíncrono',
    spiralIteration: 'spiral-3',
    status: 'Atendido'
  },
  {
    code: 'RF-05',
    type: 'RF',
    title: 'Geração e Envio de Código OTP',
    description: 'Worker consome mensagem, gera código numérico criptográfico de 6 dígitos e despacha via SMTP.',
    targetMetric: 'Geração de OTP em < 1ms e despacho assíncrono',
    verificationMethod: 'Worker mock test validando entrega e atualização de status',
    spiralIteration: 'spiral-3',
    status: 'Atendido'
  },
  {
    code: 'RF-06',
    type: 'RF',
    title: 'Tratamento de Falhas com Dead Letter Queue',
    description: 'Roteamento automático para zyconomes_emails_dlq após 3 tentativas malsucedidas de envio.',
    targetMetric: 'Zero mensagens descartadas sem rastro',
    verificationMethod: 'Injeção de falha simulada no SMTP e inspeção da DLQ',
    spiralIteration: 'spiral-3',
    status: 'Atendido'
  },
  {
    code: 'RNF-01',
    type: 'RNF',
    title: 'Capacidade de Throughput (5.000 RPS)',
    description: 'O sistema deve suportar 5.000 requisições simultâneas por segundo sem degradação do banco ou crash de processo.',
    targetMetric: 'RPS >= 5.000 contínuos',
    verificationMethod: 'K6 Stress Test com 5.000 conexões virtuais',
    spiralIteration: 'spiral-4',
    status: 'Atendido'
  },
  {
    code: 'RNF-02',
    type: 'RNF',
    title: 'Latência de Resposta da API (P95 < 40ms)',
    description: 'O percentil P95 do endpoint POST /api/cadastro deve responder abaixo de 40 milissegundos para o cliente final.',
    targetMetric: 'P95 <= 40ms | P99 <= 95ms',
    verificationMethod: 'K6 threshold metrics analysis',
    spiralIteration: 'spiral-4',
    status: 'Atendido'
  },
  {
    code: 'RNF-03',
    type: 'RNF',
    title: 'Multiplexação de Conexões de Banco',
    description: 'O PgBouncer deve gerenciar até 10.000 conexões de clientes mantendo pool real de no máximo 100 conexões no Postgres.',
    targetMetric: 'Max conexões físicas no Postgres <= 100',
    verificationMethod: 'Query pg_stat_activity durante execução de stress test',
    spiralIteration: 'spiral-2',
    status: 'Atendido'
  },
  {
    code: 'RNF-04',
    type: 'RNF',
    title: 'Rastreabilidade Ponta a Ponta',
    description: 'Todo log, trace e mensagem de fila deve carregar obrigatoriamente o x-correlation-id para depuração rápida.',
    targetMetric: '100% de cobertura nos logs JSON',
    verificationMethod: 'Parser de logs com assert de chave correlation_id em todos os eventos',
    spiralIteration: 'spiral-1',
    status: 'Atendido'
  },
  {
    code: 'RNF-05',
    type: 'RNF',
    title: 'Segurança de Credenciais e Segredos',
    description: 'Isolamento completo de credenciais em variáveis de ambiente (.env) sem nenhum segredo no versionamento.',
    targetMetric: '0 segredos hardcoded em código',
    verificationMethod: 'Gitleaks / SAST scanner no repositório',
    spiralIteration: 'spiral-1',
    status: 'Atendido'
  }
];

export const COLLECTED_DATA_FIELDS = [
  {
    field: 'email',
    type: 'VARCHAR(255)',
    description: 'Endereço de e-mail do investidor (Chave de autenticação e identificação)',
    validationRule: 'Regex RFC 5322, formato válido, lowercase normalizado',
    securityLevel: 'Sensível / PII (LGPD Art. 5º)',
    destination: 'PostgreSQL (users.email) + Redis Lock Key + RabbitMQ Payload'
  },
  {
    field: 'nome_completo',
    type: 'VARCHAR(150)',
    description: 'Nome civil completo do titular da conta',
    validationRule: 'String 3-150 caracteres, sanitizada contra XSS/SQLi',
    securityLevel: 'PII Básico',
    destination: 'PostgreSQL (users.nome_completo) + RabbitMQ Payload (Template de e-mail)'
  },
  {
    field: 'cpf',
    type: 'CHAR(11)',
    description: 'Cadastro de Pessoas Físicas (Receita Federal)',
    validationRule: 'Validação matemática de dígitos verificadores Módulo 11',
    securityLevel: 'PII Crítico (Armazenado mascarado nos logs: ***.456.789-**)',
    destination: 'PostgreSQL (users.cpf_hash / index único criptográfico)'
  },
  {
    field: 'senha_plana ➔ senha_hash',
    type: 'VARCHAR(255)',
    description: 'Credencial de acesso convertida em hash irreversível com salt aleatório',
    validationRule: 'PBKDF2 com HMAC-SHA512, 100.000 iterações, salt de 32 bytes',
    securityLevel: 'Segredo Crítico (NUNCA trafega em filas ou logs)',
    destination: 'PostgreSQL (users.senha_hash) apenas'
  },
  {
    field: 'x-correlation-id',
    type: 'UUID v4',
    description: 'Identificador único gerado na borda HTTP e propagado em todo o ecossistema',
    validationRule: 'UUID v4 padrão RFC 4122',
    securityLevel: 'Metadado de Rastreabilidade',
    destination: 'Headers HTTP + Payload Fila + JSON Logs + Redis Audit'
  },
  {
    field: 'idempotency_key',
    type: 'VARCHAR(64)',
    description: 'Hash SHA-256 de identificação de requisição única (idemp:cad:{email})',
    validationRule: 'String atômica com TTL de 300 segundos',
    securityLevel: 'Controle de Concorrência',
    destination: 'Redis Cache Memory'
  },
  {
    field: 'otp_code',
    type: 'CHAR(6)',
    description: 'Código numérico de autenticação em 2 fatores para ativação de conta',
    validationRule: '6 dígitos aleatórios criptograficamente seguros (crypto.randomInt)',
    securityLevel: 'Segredo Temporário (TTL de 600 segundos)',
    destination: 'Redis (otp:{user_id}) + SMTP Email Body'
  },
  {
    field: 'status',
    type: 'ENUM',
    description: 'Estado da conta no ciclo de vida financeiro',
    validationRule: 'PENDENTE_OTP | ATIVO | SUSPENSO | BLOQUEADO',
    securityLevel: 'Estado Transacional',
    destination: 'PostgreSQL (users.status)'
  }
];

export const CLASS_HIERARCHY_DATA = [
  {
    className: 'BaseHttpController',
    module: 'src/controllers/base.controller.ts',
    responsibility: 'Manipulação padronizada de responses HTTP, extração de Correlation-ID e formatação de erros RFC 7807.',
    methods: [
      'extractCorrelationId(req: Request): string',
      'sendSuccess(res: Response, data: any, statusCode: number = 200): void',
      'sendError(res: Response, error: AppError, correlationId: string): void'
    ],
    relations: 'Herdado por AuthController, OrdersController, HealthController'
  },
  {
    className: 'AuthController',
    module: 'src/controllers/auth.controller.ts',
    responsibility: 'Endpoint /api/cadastro e orquestração do pipeline de registro de novos investidores.',
    methods: [
      'cadastrarUsuario(req: Request, res: Response): Promise<Response>',
      'validarOtp(req: Request, res: Response): Promise<Response>'
    ],
    relations: 'Utiliza IdempotencyGuard, UserService, RabbitMQProducer'
  },
  {
    className: 'IdempotencyGuard',
    module: 'src/services/idempotency.service.ts',
    responsibility: 'Gerenciamento de travas atômicas no Redis usando primitivas SETNX e controle de TTL.',
    methods: [
      'acquireLock(key: string, ttlSeconds: number): Promise<boolean>',
      'releaseLock(key: string): Promise<void>',
      'isLocked(key: string): Promise<boolean>'
    ],
    relations: 'Injetado nos Controllers de mutação de estado'
  },
  {
    className: 'PgBouncerConnectionPool',
    module: 'src/database/pool.service.ts',
    responsibility: 'Gerenciador de pool multiplexado conectado ao PgBouncer na porta 6432 com healthcheck e retry.',
    methods: [
      'query<T>(sql: string, params?: any[]): Promise<QueryResult<T>>',
      'transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>',
      'getPoolStats(): PoolTelemetry'
    ],
    relations: 'Utilizado por todos os repositórios de dados (UserRepository)'
  },
  {
    className: 'RabbitMQExchangeProducer',
    module: 'src/queue/producer.service.ts',
    responsibility: 'Publicação resiliente com confirmation channel, headers de correlação e roteamento para DLX.',
    methods: [
      'publishEvent(exchange: string, routingKey: string, payload: any, correlationId: string): Promise<boolean>',
      'assertTopology(): Promise<void>'
    ],
    relations: 'Conecta ao broker RabbitMQ e publica para EmailWorker e OrdersWorker'
  },
  {
    className: 'EmailWorkerConsumer',
    module: 'src/workers/email.worker.ts',
    responsibility: 'Consumo desacoplado de fila, geração de OTP, integração SMTP com backoff e envio para DLQ em falhas graves.',
    methods: [
      'startConsumer(prefetch: number = 50): Promise<void>',
      'processMessage(msg: Message): Promise<void>',
      'routeToDeadLetter(msg: Message, error: Error): Promise<void>'
    ],
    relations: 'Consome fila_emails_cadastro, interage com OTPService e DeadLetterHandler'
  },
  {
    className: 'DeadLetterHandler',
    module: 'src/queue/deadLetter.service.ts',
    responsibility: 'Inspeção, armazenamento persistente de metadados de erro e reprocessamento sob demanda da DLQ.',
    methods: [
      'captureFailedMessage(payload: DeadLetterPayload): Promise<void>',
      'listDeadLetters(limit: number): Promise<DeadLetterMessage[]>',
      'retryMessage(messageId: string): Promise<boolean>'
    ],
    relations: 'Gerencia zyconomes_emails_dlq'
  },
  {
    className: 'StructuredTelemetryLogger',
    module: 'src/utils/logger.service.ts',
    responsibility: 'Emissão de logs estruturados em JSON para stdout sem bloquear o Event Loop.',
    methods: [
      'info(event: string, metadata: LogMetadata): void',
      'warn(event: string, metadata: LogMetadata): void',
      'error(event: string, error: Error, metadata: LogMetadata): void'
    ],
    relations: 'Injetado globalmente em todos os serviços do sistema'
  }
];
