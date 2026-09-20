/**
 * ==============================================================================
 * ZYCONOMES INSTITUTIONAL BANKING - ASYNC EMAIL & OTP WORKER
 * ==============================================================================
 * Implementação de Engenharia de Confiabilidade (SRE)
 * Padrões aplicados:
 * 1. Prefetch Estrito (QoS)
 * 2. Circuit Breaker (Closed, Open, Half-Open)
 * 3. Backoff Exponencial com Jitter
 * 4. Roteamento para Dead Letter Queue (DLQ)
 * ==============================================================================
 */

const amqplib = require('amqplib');
const crypto = require('crypto');
const Redis = require('ioredis');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://127.0.0.1:5672';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const QUEUE_NAME = 'fila_emails_cadastro';
const DLX_NAME = 'zyconomes_dlx';
const DLQ_NAME = 'zyconomes_emails_dlq';
const OTP_TTL_SECONDS = parseInt(process.env.OTP_TTL_SECONDS || '300', 10);

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 100, 2000);
  }
});

function logJSON(level, event, metadata = {}) {
  process.stdout.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'zyconomes-worker-email',
    ...metadata
  }) + '\n');
}

class CircuitBreakerWorker {
  constructor() {
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF-OPEN
    this.failureCount = 0;
    this.threshold = 5;
    this.cooldownTime = 30000;
    this.nextAttempt = Date.now();
    this.prefetchCount = parseInt(process.env.WORKER_PREFETCH || '50', 10);
  }

  async start() {
    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      
      // Declaração de Filas e DLX para garantia de topologia
      await channel.assertExchange(DLX_NAME, 'direct', { durable: true });
      await channel.assertQueue(DLQ_NAME, { durable: true });
      await channel.bindQueue(DLQ_NAME, DLX_NAME, 'emails_dlq_key');
      
      await channel.assertQueue(QUEUE_NAME, { 
        durable: true,
        arguments: {
          'x-dead-letter-exchange': DLX_NAME,
          'x-dead-letter-routing-key': 'emails_dlq_key'
        }
      });
      
      // Trava física de volume: QoS / Backpressure
      await channel.prefetch(this.prefetchCount);
      logJSON('INFO', 'WorkerStarted', { prefetch: this.prefetchCount });

      channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;

        // Máquina de Estado do Circuit Breaker
        if (this.state === 'OPEN') {
          if (Date.now() > this.nextAttempt) {
            this.state = 'HALF-OPEN';
            logJSON('INFO', 'CircuitBreakerHalfOpen');
          } else {
            // Rejeita a mensagem temporariamente (requeue=true) para segurar na fila
            return channel.nack(msg, false, true);
          }
        }

        try {
          const payload = JSON.parse(msg.content.toString());
          const correlationId = msg.properties.headers?.['x-correlation-id'] || 'system';
          
          await this.executeTask(payload, correlationId);
          
          // Sucesso reseta o circuito
          if (this.state === 'HALF-OPEN') {
            this.state = 'CLOSED';
            this.failureCount = 0;
            logJSON('INFO', 'CircuitBreakerClosed');
          }
          
          channel.ack(msg);
        } catch (error) {
          this.handleFailure(channel, msg, error);
        }
      });
    } catch (err) {
      logJSON('FATAL', 'RabbitMQConnectionError', { error: err.message });
      setTimeout(() => this.start(), 5000); // Tenta reconectar se a própria conexão falhar
    }
  }

  async executeTask(payload, correlationId) {
    // Tarefa 1: Gerar OTP Seguro
    const otp = crypto.randomInt(100000, 999999).toString();
    const normalizedEmail = payload.email.trim().toLowerCase();
    const otpKey = `otp:code:${normalizedEmail}`;
    const attemptsKey = `otp:attempts:${normalizedEmail}`;
    
    // Tarefa 2: Persistência de Alta Performance (Redis)
    await redisClient.set(otpKey, otp, 'EX', OTP_TTL_SECONDS);
    await redisClient.del(attemptsKey);

    // Tarefa 3: Disparo (Simulado - Ponto de Falha Mapeado)
    // Para simular uma falha externa (gateway caindo sob stress), poderíamos injetar um throw baseado em rand.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        logJSON('INFO', 'OtpDelivered', { correlation_id: correlationId, email: normalizedEmail });
        resolve(true);
      }, 40);
    });
  }

  handleFailure(channel, msg, error) {
    this.failureCount++;
    const correlationId = msg.properties.headers?.['x-correlation-id'] || 'system';
    
    logJSON('ERROR', 'TaskExecutionFailed', { correlation_id: correlationId, error: error.message, failures: this.failureCount });

    // Armar o disjuntor se as falhas passarem do limite
    if (this.failureCount >= this.threshold && this.state !== 'OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.cooldownTime;
      logJSON('WARN', 'CircuitBreakerOpened', { cooldown_ms: this.cooldownTime });
    }

    const headers = msg.properties.headers || {};
    const retryCount = (headers['x-retry-count'] || 0) + 1;

    if (retryCount > 3) {
      // Mensagem Envenenada (Poison Pill): Routing explícito para a DLQ
      logJSON('ERROR', 'MessageSentToDLQ', { correlation_id: correlationId });
      channel.nack(msg, false, false); // requeue=false com política de DLX na fila joga pra DLQ
    } else {
      // Re-enfileiramento Ativo com Atraso Simulado (Simulando o atraso requeueando)
      // Em produção real com RabbitMQ, usamos um Exchange de retentativa com x-message-ttl.
      // Como aproximação no nack puro: publicamos a mensagem de novo com o cabeçalho incrementado.
      const jitter = Math.floor(Math.random() * 500);
      const backoffMs = Math.pow(2, retryCount) * 1000 + jitter;
      
      logJSON('WARN', 'SchedulingRetry', { correlation_id: correlationId, retry_count: retryCount, delay_ms: backoffMs });
      
      setTimeout(() => {
        channel.publish('', QUEUE_NAME, msg.content, {
          persistent: true,
          headers: { ...headers, 'x-retry-count': retryCount }
        });
        channel.ack(msg); // Descarta a original
      }, backoffMs);
    }
  }
}

const worker = new CircuitBreakerWorker();
worker.start();
