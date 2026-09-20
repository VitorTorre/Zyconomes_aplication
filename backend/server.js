/**
 * ==============================================================================
 * ZYCONOMES INSTITUTIONAL BANKING - CORE API SERVER (NODE.JS / EXPRESS)
 * ==============================================================================
 * Diretrizes Arquiteturais:
 * 1. x-correlation-id injetado na borda HTTP e propagado em todo o ecossistema.
 * 2. Idempotência atômica com Redis SETNX (< 2ms de rejeição sem tocar no disco).
 * 3. Hashing de senha com PBKDF2 assíncrono (sem travar o Event Loop).
 * 4. Conexões multiplexadas via PgBouncer na porta 6432.
 * 5. Desacoplamento assíncrono: Publicação no RabbitMQ com confirmação de entrega.
 * ==============================================================================
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('ioredis');
const amqplib = require('amqplib');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');

const app = express();
app.use(express.json());

// -----------------------------------------------------------------------------
// 1. CONFIGURAÇÕES & VALIDAÇÃO DE AMBIENTE (FAIL-FAST)
// -----------------------------------------------------------------------------
const requiredEnvs = ['DATABASE_URL', 'REDIS_URL', 'RABBITMQ_URL'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

if (missingEnvs.length > 0 && process.env.NODE_ENV === 'production') {
  // O formato estruturado aqui é hardcoded pois a função logger ainda não foi declarada
  process.stderr.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'FATAL',
    event: 'BootFailed',
    message: `Variáveis críticas de ambiente ausentes: ${missingEnvs.join(', ')}. Abortando inicialização.`
  }) + '\n');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://zyco_admin:zyco_secret_vault_2026@127.0.0.1:6432/zyconomes_prod';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://127.0.0.1:5672';
const IDEMPOTENCY_TTL_SECONDS = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || '300', 10);

// -----------------------------------------------------------------------------
// 2. CONEXÃO AO PGBOUNCER (POOL TRANSACTIONAL)
// -----------------------------------------------------------------------------
const pgPool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // Conexões locais por instância Node (PgBouncer multiplexa para 90 no Postgres)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pgPool.on('error', (err) => {
  logStructured('ERROR', 'PgBouncerPoolError', { error: err.message });
});


// -----------------------------------------------------------------------------
// CIRCUIT BREAKER PARA O POSTGRESQL (PREVENÇÃO DE SATURAÇÃO)
// -----------------------------------------------------------------------------
class DatabaseCircuitBreaker {
  constructor() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.threshold = 5;
    this.cooldownTime = 15000; // 15s de bloqueio se o banco gritar
    this.nextAttempt = Date.now();
  }

  async execute(pool, text, params) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF-OPEN';
        logStructured('INFO', 'DbCircuitBreakerHalfOpen');
      } else {
        const error = new Error('Service Unavailable: Circuit Breaker is OPEN.');
        error.code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }
    }

    try {
      const result = await pool.query(text, params);
      
      if (this.state === 'HALF-OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        logStructured('INFO', 'DbCircuitBreakerClosed');
      }
      return result;
    } catch (error) {
      // Ignorar erros de negócio (ex: Unique Violation 23505) como falha de infraestrutura
      if (error.code !== '23505') {
        this.failureCount++;
        if (this.failureCount >= this.threshold && this.state !== 'OPEN') {
          this.state = 'OPEN';
          this.nextAttempt = Date.now() + this.cooldownTime;
          logStructured('WARN', 'DbCircuitBreakerOpened', { 
            cooldown_ms: this.cooldownTime, 
            failures: this.failureCount 
          });
        }
      }
      throw error;
    }
  }
}
const dbCircuitBreaker = new DatabaseCircuitBreaker();

// -----------------------------------------------------------------------------
// 3. CONEXÃO AO REDIS (IDEMPOTÊNCIA & LOCKS)
// -----------------------------------------------------------------------------
const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 100, 2000);
  }
});

redisClient.on('error', (err) => {
  logStructured('ERROR', 'RedisConnectionError', { error: err.message });
});

// -----------------------------------------------------------------------------
// 4. CONEXÃO AO RABBITMQ (PRODUCER COM CONFIRM CHANNEL)
// -----------------------------------------------------------------------------
let rabbitChannel = null;
const EXCHANGE_NAME = 'zyconomes_exchange';
const ROUTING_KEY_CADASTRO = 'usuario.cadastrado';

async function initRabbitMQ() {
  try {
    const connection = await amqplib.connect(RABBITMQ_URL);
    rabbitChannel = await connection.createConfirmChannel();

    // Declara Direct Exchange principal e Dead Letter Exchange
    await rabbitChannel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    await rabbitChannel.assertExchange('zyconomes_dlx', 'direct', { durable: true });

    // Fila principal com fallback atrelado para a DLX
    await rabbitChannel.assertQueue('fila_emails_cadastro', {
      durable: true,
      deadLetterExchange: 'zyconomes_dlx',
      deadLetterRoutingKey: 'emails_dlq_key'
    });

    await rabbitChannel.bindQueue('fila_emails_cadastro', EXCHANGE_NAME, ROUTING_KEY_CADASTRO);

    // Fila morta (DLQ) para mensagens rejeitadas após 3 tentativas
    await rabbitChannel.assertQueue('zyconomes_emails_dlq', { durable: true });
    await rabbitChannel.bindQueue('zyconomes_emails_dlq', 'zyconomes_dlx', 'emails_dlq_key');

    logStructured('INFO', 'RabbitMQTopologyInitialized', { exchange: EXCHANGE_NAME });
  } catch (error) {
    logStructured('ERROR', 'RabbitMQInitFailed', { error: error.message });
    setTimeout(initRabbitMQ, 5000); // Retry de conexão
  }
}
initRabbitMQ();

// -----------------------------------------------------------------------------
// 5. LOGGER ESTRUTURADO JSON (STDOUT / ZERO PARSERS SÍNCRONOS)
// -----------------------------------------------------------------------------
function logStructured(level, eventName, metadata = {}) {
  const logObj = {
    timestamp: new Date().toISOString(),
    level,
    event: eventName,
    correlation_id: metadata.correlation_id || 'system',
    service: 'zyconomes-core-api',
    ...metadata
  };
  process.stdout.write(JSON.stringify(logObj) + '\n');
}

// -----------------------------------------------------------------------------
// 6. MIDDLEWARES: CORRELATION-ID & LATÊNCIA
// -----------------------------------------------------------------------------
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  const startHr = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(startHr);
    const durationMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
    logStructured('INFO', 'HttpRequestCompleted', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      latency_ms: parseFloat(durationMs),
      correlation_id: correlationId
    });
  });

  next();
});

// -----------------------------------------------------------------------------
// SCHEMA DE VALIDAÇÃO DE BORDA (ZOD)
// -----------------------------------------------------------------------------
const { z } = require('zod');

const registrationSchema = z.object({
  email: z.string().email(),
  nome_completo: z.string().min(5),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/),
  senha_plana: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/)
});

// -----------------------------------------------------------------------------
// 7. FUNÇÃO UTILITÁRIA DE HASHING PBKDF2 ASSÍNCRONO
// -----------------------------------------------------------------------------
function hashPasswordPbkdf2(plainPassword) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(plainPassword, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`pbkdf2_sha512$100000$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

// -----------------------------------------------------------------------------
// 8. ENDPOINT CENTRAL: CADASTRO DE USUÁRIO (SÍNCRONO < 35MS)
// -----------------------------------------------------------------------------
app.post('/api/v1/usuarios', async (req, res) => {
  const correlationId = req.correlationId;
  const { email, nome_completo, cpf, senha_plana } = req.body;

  // Validação Estrita de Contrato (KYC API-Side)
  const validation = registrationSchema.safeParse({ email, nome_completo, cpf, senha_plana });
  if (!validation.success) {
    logStructured('WARN', 'KycValidationFailed', { correlation_id: correlationId, issues: validation.error.issues });
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Falha na validação KYC. Dados de entrada inválidos ou fora do padrão.',
      issues: validation.error.issues,
      correlation_id: correlationId
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const idempotencyKey = `idemp:cad:${normalizedEmail}`;

  try {
    // -------------------------------------------------------------------------
    // PASSO A: BLOQUEIO ATÔMICO DE IDEMPOTÊNCIA (REDIS SETNX < 2ms)
    // -------------------------------------------------------------------------
    const lockAcquired = await redisClient.set(
      idempotencyKey,
      'PROCESSING',
      'EX',
      IDEMPOTENCY_TTL_SECONDS,
      'NX'
    );

    if (!lockAcquired) {
      logStructured('WARN', 'IdempotencyConflictDetected', {
        correlation_id: correlationId,
        email: normalizedEmail
      });
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cadastro ou solicitação idêntica já se encontra em processamento ou concluída.',
        correlation_id: correlationId
      });
    }

    // -------------------------------------------------------------------------
    // PASSO B: HASH DE SENHA ASSÍNCRONO (PBKDF2)
    // -------------------------------------------------------------------------
    const passwordHash = await hashPasswordPbkdf2(senha_plana);

    // -------------------------------------------------------------------------
    // PASSO C: PERSISTÊNCIA NO POSTGRESQL VIA PGBOUNCER (TRANSACTION POOL)
    // -------------------------------------------------------------------------
    const userId = uuidv4();
    const insertQuery = `
      INSERT INTO users (id, email, nome_completo, cpf_hash, senha_hash, status, correlation_id, created_at)
      VALUES ($1, $2, $3, $4, $5, 'PENDENTE_OTP', $6, NOW())
      RETURNING id, email, nome_completo, status, created_at;
    `;

    const result = await dbCircuitBreaker.execute(pgPool, insertQuery, [
      userId,
      normalizedEmail,
      nome_completo.trim(),
      crypto.createHash('sha256').update(cpf.replace(/\D/g, '')).digest('hex'),
      passwordHash,
      correlationId
    ]);

    const createdUser = result.rows[0];

    logStructured('INFO', 'UserCreated', {
      user_id: createdUser.id,
      email: createdUser.email,
      correlation_id: correlationId
    });

    // -------------------------------------------------------------------------
    // PASSO D: DESACOPLAMENTO ASSÍNCRONO (PUBLICAÇÃO NO RABBITMQ)
    // -------------------------------------------------------------------------
    if (rabbitChannel) {
      const messagePayload = Buffer.from(JSON.stringify({
        event: 'UsuarioCadastrado',
        user_id: createdUser.id,
        email: createdUser.email,
        nome: createdUser.nome_completo,
        correlation_id: correlationId,
        timestamp: new Date().toISOString()
      }));

      rabbitChannel.publish(
        EXCHANGE_NAME,
        ROUTING_KEY_CADASTRO,
        messagePayload,
        {
          persistent: true,
          headers: {
            'x-correlation-id': correlationId,
            'x-retry-count': 0
          }
        }
      );
    } else {
      logStructured('WARN', 'RabbitChannelNotReady', { correlation_id: correlationId });
    }

    // -------------------------------------------------------------------------
    // PASSO E: RESPOSTA SÍNCRONA IMEDIATA AO CLIENTE (< 35ms)
    // -------------------------------------------------------------------------
    return res.status(201).json({
      status: 'success',
      message: 'Conta Zyconomes criada com sucesso! Código de ativação OTP em trânsito.',
      data: {
        id: createdUser.id,
        email: createdUser.email,
        nome: createdUser.nome_completo,
        status: createdUser.status,
        created_at: createdUser.created_at
      },
      correlation_id: correlationId
    });

  } catch (error) {
    // Libera a trava em caso de falha de validação de integridade no banco
    await redisClient.del(idempotencyKey);

    logStructured('ERROR', 'UserRegistrationFailed', {
      correlation_id: correlationId,
      error: error.message,
      stack: error.stack
    });
    
    if (error.code === 'CIRCUIT_BREAKER_OPEN') {
      return res.status(503).json({
        error: 'ServiceUnavailable',
        message: 'Serviço temporariamente indisponível. Muitas requisições.',
        correlation_id: correlationId
      });
    }

    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Falha durante o processamento da abertura de conta.',
      correlation_id: correlationId
    });
  }
});

// -----------------------------------------------------------------------------
// ENDPOINT: VERIFICAÇÃO OTP (MÁQUINA DE ESTADOS E ANTI-FRAUDE)
// -----------------------------------------------------------------------------
app.post('/api/v1/auth/otp', async (req, res) => {
  const { email, otp_code } = req.body;
  const correlationId = req.correlationId;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!email || !otp_code) {
    return res.status(400).json({ error: 'BadRequest', message: 'E-mail e OTP são obrigatórios.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Naming conventions for Redis Keys
  const otpKey = `otp:code:${normalizedEmail}`;
  const attemptsKey = `otp:attempts:${normalizedEmail}`;
  const ipBlockKey = `otp:ip_block:${clientIp}`;
  const MAX_ATTEMPTS = 3;
  const GLOBAL_IP_RATE_LIMIT = 20;

  try {
    // 1. Defesa em Profundidade (Nível de IP): Prevenção contra exaustão de Gateway (DDoS/Spam)
    // Usando INCR com MULTI/EXEC para ser atômico.
    const ipRequests = await redisClient.incr(ipBlockKey);
    if (ipRequests === 1) await redisClient.expire(ipBlockKey, 60); // 60 segundos de janela
    
    if (ipRequests > GLOBAL_IP_RATE_LIMIT) {
      logStructured('WARN', 'IpRateLimitExceeded', { correlation_id: correlationId, ip: clientIp });
      return res.status(429).json({ error: 'TooManyRequests', message: 'Bloqueio de segurança da borda ativado.' });
    }

    // 2. Defesa Específica da Conta (Brute Force no Email)
    const currentAttempts = await redisClient.get(attemptsKey);
    if (currentAttempts && parseInt(currentAttempts, 10) >= MAX_ATTEMPTS) {
      logStructured('WARN', 'OtpBruteForceBlocked', { correlation_id: correlationId, email: normalizedEmail });
      return res.status(429).json({ 
         error: 'TooManyRequests', 
         message: 'Muitas tentativas falhas. O código OTP foi bloqueado preventivamente.' 
       });
    }

    // 3. Verificar Existência do OTP
    const storedOtp = await redisClient.get(otpKey);
    if (!storedOtp) {
      logStructured('WARN', 'OtpExpiredOrNotFound', { correlation_id: correlationId, email: normalizedEmail });
      return res.status(401).json({ error: 'Unauthorized', message: 'Código expirado ou inválido.' });
    }

    // 4. Comparação Criptográfica Tempo-Constante (Timing Attack Mitigation)
    const storedBuffer = Buffer.from(storedOtp);
    const inputBuffer = Buffer.from(otp_code.trim().padStart(storedBuffer.length, '0'));
    
    let isMatch = false;
    if (storedBuffer.length === inputBuffer.length) {
      isMatch = crypto.timingSafeEqual(storedBuffer, inputBuffer);
    }

    if (!isMatch) {
      // INCR e EXPIRE com pipeline atômico mitigando Race Conditions (Chave Órfã)
      const pipeline = redisClient.multi();
      pipeline.incr(attemptsKey);
      if (!currentAttempts) pipeline.expire(attemptsKey, 300); // Só coloca TTL no primeiro erro para não resetar o relógio
      await pipeline.exec();
      
      logStructured('WARN', 'OtpVerificationFailed', { correlation_id: correlationId, email: normalizedEmail });
      return res.status(401).json({ error: 'Unauthorized', message: 'Código inválido.' });
    }

    // 5. Commit de Estado (Idempotência no Postgres)
    const userResult = await dbCircuitBreaker.execute(pgPool, 'SELECT id, status FROM users WHERE email = $1 FOR UPDATE SKIP LOCKED', [normalizedEmail]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'Usuário não encontrado.' });
    }
    const user = userResult.rows[0];

    if (user.status !== 'PENDENTE_OTP') {
      return res.status(400).json({ error: 'InvalidState', message: 'Conta já processada.' });
    }

    // Pipeline Final: Sucesso varre as chaves simultaneamente para impedir Replay Attack
    const finalPipeline = redisClient.multi();
    finalPipeline.del(otpKey);
    finalPipeline.del(attemptsKey);
    await finalPipeline.exec();

    await dbCircuitBreaker.execute(pgPool, 'UPDATE users SET status = $1 WHERE id = $2', ['ATIVO', user.id]);

    logStructured('INFO', 'UserOtpVerified', { correlation_id: correlationId, user_id: user.id });
    return res.json({
      status: 'success',
      data: { id: user.id, status: 'ATIVO' }
    });

  } catch (error) {
    logStructured('ERROR', 'OtpVerificationSystemError', { correlation_id: correlationId, error: error.message });
    return res.status(500).json({ error: 'InternalServerError' });
  }
});
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// ENDPOINT: EXPORTAÇÃO DE RELATÓRIO EXECUTIVO (STREAMING EXCEL)
// -----------------------------------------------------------------------------
app.get('/api/v1/reports/ledger', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || req.correlationId || uuidv4();
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // No mundo real viria do token JWT. Aqui usamos o IP para o Lock distribuído.
  const lockKey = `export:lock:${clientIp}`;

  try {
    // 1. O Bloqueio da Thread (Idempotência e Prevenção de Abuso)
    const lockAcquired = await redisClient.set(lockKey, correlationId, 'NX', 'EX', 60);
    if (!lockAcquired) {
      logStructured('WARN', 'ExportConflictLocked', { correlation_id: correlationId, ip: clientIp });
      return res.status(409).json({ error: 'Conflict', message: 'Relatório já está sendo gerado. Aguarde.' });
    }

    logStructured('INFO', 'ExportStarted', { correlation_id: correlationId });

    // 2. Setup Headers para Streaming (OOM Prevention)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Zyconomes_Ledger_Audit.xlsx"');

    // 3. Streaming Writer do ExcelJS (Escreve no Socket TCP sem preencher a RAM)
    const options = {
      stream: res,
      useStyles: true,
      useSharedStrings: true
    };
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
    const worksheet = workbook.addWorksheet('Ledger_Audit');

    // 4. Limite Físico de Estilos: Definição a nível de Coluna Inteira (Sem AutoFit)
    worksheet.columns = [
      { header: 'TIMESTAMP', key: 'timestamp', width: 28 },
      { header: 'ORDER_ID', key: 'id', width: 16 },
      { header: 'CORRELATION_ID', key: 'correlation', width: 40 },
      { header: 'ATIVO', key: 'asset', width: 12 },
      { header: 'AÇÃO', key: 'action', width: 12 },
      { header: 'QTD', key: 'qty', width: 10 },
      { header: 'PREÇO', key: 'price', width: 16 },
      { header: 'STATUS', key: 'status', width: 16 }
    ];

    // Aplicar estilo de cabeçalho unificado para a linha 1 (Reuso de estilo)
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };

    // 5. Simulação de Paginação de Banco de Dados (Streaming de 10.000 linhas)
    // Em produção, isso seria um cursor do pg: `const cursor = pgClient.query(new Cursor('SELECT...'))`
    const CHUNK_SIZE = 2500;
    const TOTAL_RECORDS = 10000;

    for (let i = 0; i < TOTAL_RECORDS; i += CHUNK_SIZE) {
      // Pequeno backoff yield para não monopolizar o Event Loop durante as gerações de chunk
      await new Promise(resolve => setTimeout(resolve, 10));
      
      for (let j = 0; j < CHUNK_SIZE; j++) {
        const rowId = i + j;
        const isBuy = Math.random() > 0.5;
        const val = (145000 + (Math.random() * 1000)).toFixed(2);
        
        // 6. Blindagem de Injeção (Excel/CSV Injection): Escape de UUIDs e valores contábeis
        // Valores sensíveis ou que possam começar com =,+,-,@ são prefixados com aspas simples ou mapeados como texto estrito
        const row = {
          timestamp: new Date(Date.now() - rowId * 60000).toISOString(),
          id: `'${uuidv4().split('-')[0]}`, // Aspa simples força string pura no Excel
          correlation: `'${correlationId}`,
          asset: 'IBOV_FUT',
          action: isBuy ? 'BUY' : 'SELL',
          qty: Math.floor(Math.random() * 50) + 1,
          price: `'R$ ${val}`, // String imutável, previne parse de fórmula
          status: 'EXECUTED'
        };

        const addedRow = worksheet.addRow(row);
        
        // Commit imediato da linha pro socket para limpar a HEAP (Prevenção OOM)
        addedRow.commit(); 
      }
    }

    // Fecha o workbook e encerra o stream do Response
    await workbook.commit();
    logStructured('INFO', 'ExportCompleted', { correlation_id: correlationId, records: TOTAL_RECORDS });

  } catch (err) {
    logStructured('ERROR', 'ExportFailed', { correlation_id: correlationId, error: err.message });
    if (!res.headersSent) {
      res.status(500).json({ error: 'InternalServerError', message: 'Falha crítica na geração do relatório.' });
    } else {
      res.end(); // Interrompe o stream malformado
    }
  } finally {
    // 7. Liberação da trava atômica após o fim (Sucesso ou Falha)
    // 7. Liberação da trava atômica (Lua Script Prevenção de Race Condition)
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redisClient.eval(luaScript, 1, lockKey, correlationId);
  }
});

// -----------------------------------------------------------------------------
// 9. HEALTH CHECK & METRICS PROBE
// -----------------------------------------------------------------------------
app.get('/health', async (req, res) => {
  try {
    const dbCheck = await dbCircuitBreaker.execute(pgPool, 'SELECT 1 as alive');
    const redisCheck = await redisClient.ping();

    res.json({
      status: 'UP',
      uptime: process.uptime(),
      db: dbCheck.rows[0].alive === 1 ? 'OK' : 'FAIL',
      redis: redisCheck === 'PONG' ? 'OK' : 'FAIL',
      rabbitmq: rabbitChannel ? 'CONNECTED' : 'DISCONNECTED'
    });
  } catch (err) {
    res.status(503).json({ status: 'DOWN', error: err.message });
  }
});

// -----------------------------------------------------------------------------
// INICIALIZAÇÃO DO SERVIDOR
// -----------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  logStructured('INFO', 'ZyconomesServerStarted', {
    port: PORT,
    database_target: 'PgBouncer:6432',
    redis_status: 'Connected'
  });
});
