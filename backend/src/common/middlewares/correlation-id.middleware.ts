import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    // Phase 3 Observability: Extract W3C traceparent or frontend correlation ID
    const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
    const traceparent = (req.headers['traceparent'] as string) || `00-${correlationId.replace(/-/g, '').padEnd(32, '0')}-${randomUUID().replace(/-/g, '').substring(0, 16)}-01`;

    // Attach to request for downstream services (e.g. Prisma Extension, Winston Logger)
    req['correlationId'] = correlationId;
    req['traceparent'] = traceparent;

    // Attach to response so frontend can correlate failed responses to backend logs
    res.setHeader('x-correlation-id', correlationId);

    // Initial Request Log
    this.logger.log(`[${correlationId}] ${req.method} ${req.url}`);

    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const statusCode = res.statusCode;
      
      const logMessage = `[${correlationId}] ${req.method} ${req.originalUrl} ${statusCode} ${ms}ms`;
      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
