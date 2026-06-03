import { EventOutboxStatus } from '@prisma/client';
import { Queue } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { DomainEventRelayService } from './domain-event-relay.service';

describe('DomainEventRelayService', () => {
  let service: DomainEventRelayService;

  const mockOutbox = {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockRequestContext = {
    getCorrelationId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DomainEventRelayService(
      { domainEventOutbox: mockOutbox } as unknown as PrismaService,
      mockQueue as unknown as Queue,
      mockRequestContext as any,
    );
  });

  it('leaves an event in PROCESSING after successful enqueue instead of marking it PROCESSED', async () => {
    const event = {
      id: 'event-1',
      eventType: 'order.status.changed',
      payload: { orderId: 'order-1', newStatus: 'CONFIRMED' },
      retryCount: 0,
      createdAt: new Date(),
    };

    mockOutbox.findMany.mockResolvedValue([event]);
    mockOutbox.updateMany.mockResolvedValue({ count: 1 });
    mockQueue.add.mockResolvedValue({ id: 'job-1' });

    await service.processOutbox();

    expect(mockOutbox.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['event-1'] }, status: EventOutboxStatus.PENDING },
      data: { status: EventOutboxStatus.PROCESSING, lastError: null },
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      'order.status.changed',
      {
        orderId: 'order-1',
        newStatus: 'CONFIRMED',
        outboxId: 'event-1',
        aggregateId: 'order-1',
        correlationId: undefined,
      },
      { jobId: 'event:event-1' },
    );
    expect(mockOutbox.update).not.toHaveBeenCalled();
  });

  it('returns an event to PENDING when enqueue fails before relay attempts are exhausted', async () => {
    const event = {
      id: 'event-2',
      eventType: 'order.status.changed',
      payload: { orderId: 'order-2' },
      retryCount: 0,
      createdAt: new Date(),
    };

    mockOutbox.findMany.mockResolvedValue([event]);
    mockOutbox.updateMany.mockResolvedValue({ count: 1 });
    mockQueue.add.mockRejectedValue(new Error('redis unavailable'));

    await service.processOutbox();

    expect(mockOutbox.update).toHaveBeenCalledWith({
      where: { id: 'event-2' },
      data: {
        status: EventOutboxStatus.PENDING,
        retryCount: { increment: 1 },
        lastError: 'redis unavailable',
        failureReason: 'redis unavailable',
        lastProcessedAt: expect.any(Date),
      },
    });
  });

  it('marks enqueue failure as FAILED after the final relay attempt', async () => {
    const event = {
      id: 'event-3',
      eventType: 'order.status.changed',
      payload: { orderId: 'order-3' },
      retryCount: 4,
      createdAt: new Date(),
    };

    mockOutbox.findMany.mockResolvedValue([event]);
    mockOutbox.updateMany.mockResolvedValue({ count: 1 });
    mockQueue.add.mockRejectedValue(new Error('redis unavailable'));

    await service.processOutbox();

    expect(mockOutbox.update).toHaveBeenCalledWith({
      where: { id: 'event-3' },
      data: {
        status: EventOutboxStatus.FAILED,
        retryCount: { increment: 1 },
        lastError: 'redis unavailable',
        failureReason: 'redis unavailable',
        lastProcessedAt: expect.any(Date),
      },
    });
  });

  it('can requeue failed and stale processing events for replay/debug', async () => {
    mockOutbox.findMany.mockResolvedValue([{ id: 'event-4' }, { id: 'event-5' }]);
    mockOutbox.updateMany.mockResolvedValue({ count: 2 });

    await expect(service.requeueFailedAndStuck(10, 50)).resolves.toBe(2);

    expect(mockOutbox.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['event-4', 'event-5'] } },
      data: {
        status: EventOutboxStatus.PENDING,
        lastError: null,
        failureReason: null,
        processedAt: null,
      },
    });
  });

  it('propagates correlation id from payload into queued event', async () => {
    const event = {
      id: 'event-6',
      eventType: 'order.status.changed',
      payload: { orderId: 'order-6', correlationId: 'corr-6' },
      retryCount: 0,
      createdAt: new Date(),
    };

    mockOutbox.findMany.mockResolvedValue([event]);
    mockOutbox.updateMany.mockResolvedValue({ count: 1 });
    mockQueue.add.mockResolvedValue({ id: 'job-6' });

    await service.processOutbox();

    expect(mockQueue.add).toHaveBeenCalledWith(
      'order.status.changed',
      expect.objectContaining({
        outboxId: 'event-6',
        aggregateId: 'order-6',
        correlationId: 'corr-6',
      }),
      { jobId: 'event:event-6' },
    );
  });
});
