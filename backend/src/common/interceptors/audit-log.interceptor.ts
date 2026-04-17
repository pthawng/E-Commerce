import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * AuditLogInterceptor
 * 
 * Principal-Grade Hardening:
 * 1. Correlation Tracing: Every request gets an 'x-request-id' for log aggregation.
 * 2. Forensic Context: Captures IP, User-Agent, and Actor ID.
 * 3. Mutation Tracking: Logs state-changing requests (POST/PATCH/DELETE) for high-value modules.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    private readonly logger = new Logger('AuditLog');

    constructor(private readonly prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        // 1. Correlation ID (Traceability)
        const requestId = (request.headers['x-request-id'] as string) || randomUUID();
        response.setHeader('x-request-id', requestId);
        (request as any).requestId = requestId;

        const startTime = Date.now();
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || 'unknown';
        const userId = (request as any).user?.id || null;

        return next.handle().pipe(
            tap(async (data) => {
                const duration = Date.now() - startTime;

                // Only audit state-changing mutations for important domains
                const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
                const isSensitive = url.match(/\/(orders|payments|inventory|auth|cart)/);

                if (isMutation && isSensitive && response.statusCode < 400) {
                    try {
                        await this.prisma.auditLog.create({
                            data: {
                                userId,
                                action: `${method} ${url}`,
                                entityTable: this.extractEntity(url),
                                entityId: data?.id || 'unknown',
                                changes: {
                                    requestBody: this.sanitizeBody(request.body),
                                    requestId,
                                    durationMs: duration,
                                    statusCode: response.statusCode,
                                },
                                ipAddress: ip,
                                userAgent,
                            },
                        });
                    } catch (error) {
                        this.logger.error(`Failed to write AuditLog: ${error.message}`);
                    }
                }
            }),
        );
    }

    private extractEntity(url: string): string {
        const parts = url.split('/');
        return parts[2] || 'system';
    }

    private sanitizeBody(body: any): any {
        if (!body) return null;
        const sanitized = { ...body };
        const sensitiveKeys = [
            'password', 'token', 'refreshToken', 'card_number', 'cvv',
            'fullName', 'phoneNumber', 'addressLine', 'city', 'email'
        ];
        for (const key of sensitiveKeys) {
            if (sanitized[key]) sanitized[key] = '********';
        }
        return sanitized;
    }
}
