import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentService } from '../payment.service';
import { VietQRProvider } from '../providers/vietqr/vietqr.provider';
import { PayPalProvider } from '../providers/paypal/paypal.provider';
import { VNPayProvider } from '../providers/vnpay/vnpay.provider';
import { IdempotencyService } from '../services/idempotency.service';
import { PaymentMethodEnum, TransactionStatus } from '../types/payment.types';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: PrismaService;
  let idempotency: IdempotencyService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    paymentTransaction: {
      create: jest.fn(),
      update: jest.fn(),
    },
    orderTimeline: {
      create: jest.fn(),
    },
    inventoryItem: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    inventoryLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockIdempotencyService = {
    generatePaymentKey: jest.fn().mockReturnValue('key'),
    getResult: jest.fn().mockResolvedValue(null),
    storeResult: jest.fn(),
    acquireLock: jest.fn().mockResolvedValue('token'),
    releaseLock: jest.fn(),
  };

  const mockVNPayProvider = {
    createPayment: jest.fn(),
    verifyCallback: jest.fn(),
    processRefund: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: VNPayProvider, useValue: mockVNPayProvider },
        { provide: PayPalProvider, useValue: {} },
        { provide: VietQRProvider, useValue: {} },
        { provide: IdempotencyService, useValue: mockIdempotencyService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prisma = module.get<PrismaService>(PrismaService);
    idempotency = module.get<IdempotencyService>(IdempotencyService);
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment and transaction record', async () => {
      const order = { id: 'o1', totalAmount: 1000, transactions: [] };
      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockVNPayProvider.createPayment.mockResolvedValue({ transactionId: 'tx1', paymentUrl: 'url' });

      const result = await service.createPayment('o1', PaymentMethodEnum.VNPAY);

      expect(result).toBeDefined();
      expect(mockVNPayProvider.createPayment).toHaveBeenCalled();
      expect(mockPrismaService.paymentTransaction.create).toHaveBeenCalled();
      expect(mockIdempotencyService.storeResult).toHaveBeenCalled();
    });

    it('should throw ConflictException if lock is not acquired', async () => {
      mockIdempotencyService.acquireLock.mockResolvedValue(null);
      await expect(service.createPayment('o1', PaymentMethodEnum.VNPAY)).rejects.toThrow(ConflictException);
    });

    it('should return cached result if exists', async () => {
        mockIdempotencyService.getResult.mockResolvedValue({ transactionId: 'cached' });
        const result = await service.createPayment('o1', PaymentMethodEnum.VNPAY);
        expect(result).toEqual({ transactionId: 'cached' });
        expect(mockVNPayProvider.createPayment).not.toHaveBeenCalled();
    });
  });

  describe('processRefund', () => {
    it('should process refund and restore inventory to original warehouses from logs', async () => {
      const order = {
        id: 'o1',
        totalAmount: 1000,
        transactions: [{ type: 'payment', status: 'success', status_provider: 'tx_old', provider: 'VNPAY', transactionCode: 'tx_old' }],
        items: [{ productVariantId: 'v1', quantity: 2 }]
      };
      
      const mockLogs = [
        { inventoryItemId: 'inv1', productVariantId: 'v1', warehouseId: 'w1', quantityChange: -1 },
        { inventoryItemId: 'inv2', productVariantId: 'v1', warehouseId: 'w2', quantityChange: -1 },
      ];

      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockVNPayProvider.processRefund.mockResolvedValue({ success: true, refundTransactionId: 'ref_1' });
      mockPrismaService.inventoryLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.inventoryItem.findUnique
        .mockResolvedValueOnce({ id: 'inv1', quantity: 10, warehouseId: 'w1' })
        .mockResolvedValueOnce({ id: 'inv2', quantity: 5, warehouseId: 'w2' });

      const result = await service.processRefund('o1', 1000, 'test refund', true);

      expect(result.success).toBe(true);
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'inv1' } }));
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'inv2' } }));
    });
  });
});
