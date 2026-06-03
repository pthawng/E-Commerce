import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventOutboxStatus, OrderStatusEnum } from '@prisma/client';
import { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { TracingService } from '../../infra/tracing.service';
import { InventoryService } from '../../inventory/inventory.service';
import { MailService } from '../../mail/mail.service';
import { DomainActivityService } from '../../observability/domain-activity.service';
import { OrderEventConsumer } from '../services/order-event.consumer';

type OrderStatusEventPayload = {
  orderId: string;
  oldStatus: OrderStatusEnum;
  newStatus: OrderStatusEnum;
  actorId?: string;
  stateMetadata?: unknown;
  outboxId?: string;
  aggregateId?: string;
  correlationId?: string;
};

const createJob = (
  data: OrderStatusEventPayload,
  attemptsMade = 0,
  attempts = 5,
): Job<OrderStatusEventPayload> =>
  ({
    data,
    attemptsMade,
    opts: { attempts },
    id: 'job-1',
  }) as unknown as Job<OrderStatusEventPayload>;

describe('OrderEventConsumer', () => {
  let consumer: OrderEventConsumer;

  const mockOutbox = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockInventoryService = {
    deduct: jest.fn(),
    release: jest.fn(),
  };

  const mockMailService = {
    sendMail: jest.fn(),
  };

  const mockTracing = {
    trace: jest
      .fn()
      .mockImplementation((_name: string, callback: (span: SpanStub) => unknown) =>
        callback({ setAttributes: jest.fn() }),
      ),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockActivity = {
    recordOrderActivity: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new OrderEventConsumer(
      { domainEventOutbox: mockOutbox } as unknown as PrismaService,
      mockInventoryService as unknown as InventoryService,
      mockMailService as unknown as MailService,
      mockTracing as unknown as TracingService,
      mockEventEmitter as unknown as EventEmitter2,
      mockActivity as unknown as DomainActivityService,
    );
  });

  it('skips side effects when the outbox event was already processed', async () => {
    mockOutbox.findUnique.mockResolvedValue({ status: EventOutboxStatus.PROCESSED });

    await consumer.handleOrderStatusChanged(
      createJob({
        orderId: 'order-1',
        oldStatus: OrderStatusEnum.PENDING_PAYMENT,
        newStatus: OrderStatusEnum.CONFIRMED,
        outboxId: 'event-1',
      }),
    );

    expect(mockInventoryService.deduct).not.toHaveBeenCalled();
    expect(mockInventoryService.release).not.toHaveBeenCalled();
    expect(mockOutbox.update).not.toHaveBeenCalled();
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it('marks the outbox event processed only after side effects succeed', async () => {
    mockOutbox.findUnique.mockResolvedValue({ status: EventOutboxStatus.PROCESSING });
    mockInventoryService.deduct.mockResolvedValue(undefined);

    await consumer.handleOrderStatusChanged(
      createJob({
        orderId: 'order-2',
        oldStatus: OrderStatusEnum.PENDING_PAYMENT,
        newStatus: OrderStatusEnum.CONFIRMED,
        outboxId: 'event-2',
        correlationId: 'corr-2',
      }),
    );

    expect(mockInventoryService.deduct).toHaveBeenCalledWith('order-2');
    expect(mockActivity.recordOrderActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-2',
        action: 'INVENTORY_COMMITTED',
        metadata: expect.objectContaining({ outboxId: 'event-2', correlationId: 'corr-2' }),
      }),
    );
    expect(mockOutbox.update).toHaveBeenCalledWith({
      where: { id: 'event-2' },
      data: {
        status: EventOutboxStatus.PROCESSED,
        processedAt: expect.any(Date),
        firstProcessedAt: expect.any(Date),
        lastProcessedAt: expect.any(Date),
        lastError: null,
        failureReason: null,
        aggregateId: 'order-2',
        correlationId: 'corr-2',
      },
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'nerve.center.event',
      expect.objectContaining({ orderId: 'order-2', status: OrderStatusEnum.CONFIRMED }),
    );
  });

  it('keeps the outbox event unhandled when a consumer attempt fails before final retry', async () => {
    mockOutbox.findUnique.mockResolvedValue({ status: EventOutboxStatus.PROCESSING });
    mockInventoryService.deduct.mockRejectedValue(new Error('stock ledger unavailable'));

    await expect(
      consumer.handleOrderStatusChanged(
        createJob(
          {
            orderId: 'order-3',
            oldStatus: OrderStatusEnum.PENDING_PAYMENT,
            newStatus: OrderStatusEnum.CONFIRMED,
            outboxId: 'event-3',
          },
          0,
          5,
        ),
      ),
    ).rejects.toThrow('stock ledger unavailable');

    expect(mockOutbox.update).toHaveBeenCalledWith({
      where: { id: 'event-3' },
      data: {
        status: EventOutboxStatus.PROCESSING,
        lastError: 'stock ledger unavailable',
        failureReason: 'stock ledger unavailable',
        lastProcessedAt: expect.any(Date),
        aggregateId: 'order-3',
        correlationId: undefined,
        retryCount: { increment: 1 },
      },
    });
  });

  it('marks the outbox event failed on the final consumer retry', async () => {
    mockOutbox.findUnique.mockResolvedValue({ status: EventOutboxStatus.PROCESSING });
    mockInventoryService.deduct.mockRejectedValue(new Error('stock ledger unavailable'));

    await expect(
      consumer.handleOrderStatusChanged(
        createJob(
          {
            orderId: 'order-4',
            oldStatus: OrderStatusEnum.PENDING_PAYMENT,
            newStatus: OrderStatusEnum.CONFIRMED,
            outboxId: 'event-4',
          },
          4,
          5,
        ),
      ),
    ).rejects.toThrow('stock ledger unavailable');

    expect(mockOutbox.update).toHaveBeenCalledWith({
      where: { id: 'event-4' },
      data: {
        status: EventOutboxStatus.FAILED,
        lastError: 'stock ledger unavailable',
        failureReason: 'stock ledger unavailable',
        lastProcessedAt: expect.any(Date),
        aggregateId: 'order-4',
        correlationId: undefined,
        retryCount: { increment: 1 },
      },
    });
  });
});

type SpanStub = {
  setAttributes: jest.Mock;
};
