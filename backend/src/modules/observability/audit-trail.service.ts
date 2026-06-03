import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestContextService } from './request-context.service';

export interface AuditTrailRecord {
  actorId?: string;
  actorType?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  requestId?: string;
}

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async record(record: AuditTrailRecord): Promise<void> {
    const context = this.requestContext.get();

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: record.actorId,
          actorType: record.actorType ?? context?.actorType ?? 'user',
          action: record.action,
          entityTable: record.resourceType,
          entityId: record.resourceId,
          resourceType: record.resourceType,
          resourceId: record.resourceId,
          before: this.toJson(record.before),
          after: this.toJson(record.after),
          reason: record.reason,
          ipAddress: record.ipAddress ?? context?.ipAddress,
          userAgent: record.userAgent ?? context?.userAgent,
          correlationId: record.correlationId ?? context?.correlationId,
          requestId: record.requestId ?? context?.requestId,
          metadata: this.toJson(record.metadata),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to write unified audit trail: ${message}`);
    }
  }

  private toJson(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
