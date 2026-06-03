import { AuditTrailService } from '@modules/observability/audit-trail.service';
import { RequestContextService } from '@modules/observability/request-context.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BackOfficeAuditLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
    private readonly requestContext: RequestContextService,
  ) {}

  async log(params: {
    actorUserId?: string;
    targetUserId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const context = this.requestContext.get();
    const audit = await this.prisma.backOfficeAuditLog.create({
      data: {
        ...params,
        correlationId: context?.correlationId,
        ipAddress: params.ipAddress ?? context?.ipAddress,
        userAgent: params.userAgent ?? context?.userAgent,
      },
    });

    await this.auditTrail.record({
      actorId: params.actorUserId,
      actorType: 'staff',
      action: params.action,
      resourceType: params.resource,
      resourceId: params.resourceId ?? params.targetUserId ?? audit.id,
      before: this.tryParse(params.oldValue),
      after: this.tryParse(params.newValue),
      reason: params.reason,
      metadata: {
        backOfficeAuditLogId: audit.id,
        targetUserId: params.targetUserId,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return audit;
  }

  async getLogs(query: {
    actorUserId?: string;
    targetUserId?: string;
    action?: string;
    resource?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.targetUserId) where.targetUserId = query.targetUserId;
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const [items, total] = await Promise.all([
      this.prisma.backOfficeAuditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, fullName: true },
          },
          target: {
            select: { id: true, email: true, fullName: true },
          },
        },
      }),
      this.prisma.backOfficeAuditLog.count({ where }),
    ]);

    return { items, total };
  }

  private tryParse(value?: string): unknown {
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
