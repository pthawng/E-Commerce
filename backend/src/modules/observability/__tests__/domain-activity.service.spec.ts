import { PrismaService } from 'src/prisma/prisma.service';
import { DomainActivityService } from '../domain-activity.service';

describe('DomainActivityService', () => {
  it('projects order activities with correlation metadata', async () => {
    const prisma = {
      orderTimeline: {
        create: jest.fn().mockResolvedValue({ id: 'timeline-1' }),
      },
    };
    const context = {
      get: jest.fn().mockReturnValue({
        correlationId: 'corr-activity',
        requestId: 'req-activity',
        actorType: 'staff',
      }),
    };
    const service = new DomainActivityService(prisma as unknown as PrismaService, context as any);

    await service.recordOrderActivity({
      orderId: 'order-1',
      action: 'INVENTORY_COMMITTED',
      description: 'Inventory committed',
      metadata: { outboxId: 'event-1' },
    });

    expect(prisma.orderTimeline.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        action: 'INVENTORY_COMMITTED',
        actorType: 'staff',
        metadata: {
          outboxId: 'event-1',
          correlationId: 'corr-activity',
          requestId: 'req-activity',
        },
      }),
    });
  });
});
