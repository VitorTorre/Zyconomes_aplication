/**
 * middleware/logger.ts
 *
 * Centralized logging middleware that injects or generates an x-correlation-id 
 * for every incoming HTTP request and outputs structured JSON logs.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface StructuredLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  event: string;
  service: string;
  correlation_id?: string;
  [key: string]: any;
}

export function logStructured(level: StructuredLog['level'], event: string, metadata: Record<string, any> = {}) {
  const logEntry: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'zyconomes-api',
    correlation_id: metadata.correlation_id || 'system',
    ...metadata
  };
  
  // Imprime em stdout num formato limpo para coletores de log (ex: Fluentd)
  process.stdout.write(JSON.stringify(logEntry) + '\n');
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extrai dos headers ou cria um novo se não houver
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  
  // Anexa no request para uso nas rotas (e.g. repassar pro RabbitMQ)
  (req as any).correlationId = correlationId;
  
  // Anexa no response para o client ter visibilidade
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
}
