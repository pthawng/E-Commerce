import { OwnershipRegistry } from '@modules/security/ownership.registry';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { RequestContextService } from '../../observability/request-context.service';
import { OrderService } from '../order.service';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: PrismaService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockOwnershipRegistry = {
    verify: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OwnershipRegistry, useValue: mockOwnershipRegistry },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: RequestContextService, useValue: { getCorrelationId: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getOrder', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrder('o1', { id: 'u1', type: 'user' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
