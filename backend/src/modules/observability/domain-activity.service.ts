import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestContextService } from './request-context.service';

type PrismaTx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class DomainActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async recordOrderActivity(params: {
    orderId: string;
    action: string;
    description?: string;
    actorId?: string;
    actorType?: string;
    metadata?: Record<string, unknown>;
    tx?: PrismaTx;
  }) {
    const client = params.tx ?? this.prisma;
    const context = this.requestContext.get();

    return client.orderTimeline.create({
      data: {
        orderId: params.orderId,
        action: params.action,
        description: params.description,
        actorId: params.actorId,
        actorType: params.actorType ?? context?.actorType ?? 'system',
        metadata: {
          ...(params.metadata ?? {}),
          correlationId: context?.correlationId,
          requestId: context?.requestId,
        } as Prisma.InputJsonObject,
      },
    });
  }
}
