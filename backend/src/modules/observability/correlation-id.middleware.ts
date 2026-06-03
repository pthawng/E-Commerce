import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { RequestContextService } from './request-context.service';

const CORRELATION_HEADER = 'x-correlation-id';
const REQUEST_HEADER = 'x-request-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const incomingCorrelationId = this.firstHeader(request.headers[CORRELATION_HEADER]);
    const incomingRequestId = this.firstHeader(request.headers[REQUEST_HEADER]);
    const correlationId = incomingCorrelationId || incomingRequestId || randomUUID();
    const requestId = incomingRequestId || correlationId;

    response.setHeader(CORRELATION_HEADER, correlationId);
    response.setHeader(REQUEST_HEADER, requestId);

    const mutableRequest = request as Request & {
      correlationId?: string;
      requestId?: string;
    };
    mutableRequest.correlationId = correlationId;
    mutableRequest.requestId = requestId;

    this.requestContext.run(
      {
        correlationId,
        requestId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        path: request.originalUrl || request.url,
        method: request.method,
      },
      next,
    );
  }

  private firstHeader(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
  }
}
