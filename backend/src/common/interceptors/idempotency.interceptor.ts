import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
    constructor(private readonly prisma: PrismaService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const idempotencyKey = request.headers['x-idempotency-key'];

        // Only apply to POST/PATCH/DELETE or if key is provided
        if (!idempotencyKey || !['POST', 'PATCH', 'DELETE'].includes(request.method)) {
            return next.handle();
        }

        // 1. Check for existing record
        const record = await this.prisma.idempotencyRecord.findUnique({
            where: { idempotencyKey },
        });

        if (record) {
            // If it exists and has a response, return it
            if (record.responseBody !== null) {
                return of(record.responseBody);
            }
            // If it exists but no response, it's likely currently being processed
            throw new ConflictException('Request with this idempotency key is already being processed.');
        }

        // 2. Create placeholder record (Locking)
        await this.prisma.idempotencyRecord.create({
            data: {
                idempotencyKey,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h default
            },
        });

        // 3. Proceed and capture response
        return next.handle().pipe(
            tap(async (data) => {
                await this.prisma.idempotencyRecord.update({
                    where: { idempotencyKey },
                    data: {
                        responseBody: data,
                        statusCode: context.switchToHttp().getResponse().statusCode,
                    },
                });
            }),
        );
    }
}
