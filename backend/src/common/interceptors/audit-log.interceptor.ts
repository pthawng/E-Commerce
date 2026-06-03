import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditTrailService } from '../../modules/observability/audit-trail.service';
import { RequestContextService } from '../../modules/observability/request-context.service';

/**
 * AuditLogInterceptor
 *
 * Security hardening:
 * 1. Correlation Tracing: Every request gets an 'x-correlation-id' for log aggregation.
 * 2. Forensic Context: Captures IP, User-Agent, and Actor ID.
 * 3. Mutation Tracking: Logs state-changing requests (POST/PATCH/DELETE) for high-value modules.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  constructor(
    private readonly requestContext: RequestContextService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestWithContext = request as Request & {
      correlationId?: string;
      requestId?: string;
      user?: { id?: string; userId?: string; type?: string };
    };
    const correlationId =
      requestWithContext.correlationId ||
      this.firstHeader(request.headers['x-correlation-id']) ||
      requestWithContext.requestId ||
      this.firstHeader(request.headers['x-request-id']);
    const requestId = requestWithContext.requestId || correlationId;

    if (correlationId) response.setHeader('x-correlation-id', correlationId);
    if (requestId) response.setHeader('x-request-id', requestId);

    const startTime = Date.now();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const userId = requestWithContext.user?.id || requestWithContext.user?.userId || undefined;
    if (userId || correlationId || requestId) {
      this.requestContext.merge({
        userId,
        actorType: requestWithContext.user?.type ?? 'user',
        correlationId,
        requestId,
        ipAddress: ip,
        userAgent: typeof userAgent === 'string' ? userAgent : userAgent[0],
        path: url,
        method,
      });
    }

    return next.handle().pipe(
      tap(async (data) => {
        const duration = Date.now() - startTime;

        // Only audit state-changing mutations for important domains
        const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
        const isSensitive = url.match(/\/(orders|payments|inventory|auth|cart|profile)/);

        if (isMutation && isSensitive && response.statusCode < 400) {
          try {
            await this.auditTrail.record({
              actorId: userId,
              actorType: requestWithContext.user?.type ?? 'user',
              action: `${method} ${url}`,
              resourceType: this.extractEntity(url),
              resourceId: this.extractId(data),
              after: this.safeResponseSnapshot(data),
              metadata: {
                requestBody: this.sanitizeBody(request.body),
                durationMs: duration,
                statusCode: response.statusCode,
              },
              ipAddress: ip,
              userAgent: typeof userAgent === 'string' ? userAgent : userAgent[0],
              correlationId,
              requestId,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to write AuditLog: ${message}`);
          }
        }
      }),
    );
  }

  private extractEntity(url: string): string {
    const parts = url.split('/');
    return parts[2] || 'system';
  }

  private extractId(data: unknown): string {
    if (data && typeof data === 'object' && 'id' in data) {
      const id = (data as { id?: unknown }).id;
      return typeof id === 'string' ? id : 'unknown';
    }
    return 'unknown';
  }

  private safeResponseSnapshot(data: unknown): unknown {
    if (!data || typeof data !== 'object') return undefined;
    if ('passwordHash' in data || 'token' in data) return undefined;
    return data;
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body) return null;
    if (typeof body !== 'object' || Array.isArray(body)) return body;
    const sanitized = { ...(body as Record<string, unknown>) };
    const sensitiveKeys = [
      'password',
      'token',
      'refreshToken',
      'card_number',
      'cvv',
      'fullName',
      'phoneNumber',
      'addressLine',
      'city',
      'email',
    ];
    for (const key of sensitiveKeys) {
      if (sanitized[key]) sanitized[key] = '********';
    }
    return sanitized;
  }

  private firstHeader(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
  }
}
