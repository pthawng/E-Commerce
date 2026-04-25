import { PaginationService } from '@common/pagination';
import { LedgerIntegrationService } from '@modules/ledger/ledger-integration.service';
import { OrderPaymentService } from '@modules/order/services/order-payment.service';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentMethodEnum,
  PaymentProcessingStatus,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@prisma/client';
import { InventoryService } from 'src/modules/inventory/inventory.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentService } from '../payment.service';
import { PayPalProvider } from '../providers/paypal/paypal.provider';
import { VietQRProvider } from '../providers/vietqr/vietqr.provider';
import { VNPayProvider } from '../providers/vnpay/vnpay.provider';
import { IdempotencyService } from '../services/idempotency.service';
import { PaymentStateMachine } from '../services/payment-state.machine';
import { TransactionStatus } from '../types/payment.types';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    paymentTransaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    orderTimeline: {
      create: jest.fn(),
    },
    inventoryItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventoryLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    cart: {
      deleteMany: jest.fn(),
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
    queryTransaction: jest.fn(),
  };

  const mockPayPalProvider = {
    createPayment: jest.fn(),
    verifyCallback: jest.fn(),
    processRefund: jest.fn(),
    queryTransaction: jest.fn(),
  };

  const mockVietQRProvider = {
    createPayment: jest.fn(),
    verifyCallback: jest.fn(),
    processRefund: jest.fn(),
    queryTransaction: jest.fn(),
  };

  const mockStateMachine = {
    validateTransition: jest.fn(),
  };

  const mockInventoryService = {
    release: jest.fn(),
  };

  const mockOrderPaymentService = {
    confirmOrder: jest.fn(),
  };

  const mockLedgerIntegration = {
    recordOrderPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: VNPayProvider, useValue: mockVNPayProvider },
        { provide: PayPalProvider, useValue: mockPayPalProvider },
        { provide: VietQRProvider, useValue: mockVietQRProvider },
        { provide: IdempotencyService, useValue: mockIdempotencyService },
        { provide: PaymentStateMachine, useValue: mockStateMachine },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: PaginationService, useValue: {} },
        { provide: LedgerIntegrationService, useValue: mockLedgerIntegration },
        { provide: OrderPaymentService, useValue: mockOrderPaymentService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
    mockIdempotencyService.getResult.mockResolvedValue(null);
    mockIdempotencyService.acquireLock.mockResolvedValue('token');
  });

  describe('createPayment', () => {
    it('creates a payment and transaction record', async () => {
      const order = { id: 'o1', totalAmount: 1000, transactions: [] };
      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.payment.create.mockResolvedValue({ id: 'p1' });
      mockVNPayProvider.createPayment.mockResolvedValue({
        success: true,
        transactionId: 'tx1',
        paymentUrl: 'url',
      });

      const result = await service.createPayment('o1', PaymentMethodEnum.VNPAY);

      expect(result).toBeDefined();
      expect(mockVNPayProvider.createPayment).toHaveBeenCalled();
      expect(mockPrismaService.paymentTransaction.create).toHaveBeenCalled();
      expect(mockIdempotencyService.storeResult).toHaveBeenCalled();
    });

    it('throws ConflictException if lock is not acquired', async () => {
      mockIdempotencyService.acquireLock.mockResolvedValue(null);

      await expect(service.createPayment('o1', PaymentMethodEnum.VNPAY)).rejects.toThrow(
        ConflictException,
      );
    });

    it('returns cached result if it exists', async () => {
      mockIdempotencyService.getResult.mockResolvedValue({ transactionId: 'cached' });

      const result = await service.createPayment('o1', PaymentMethodEnum.VNPAY);

      expect(result).toEqual({ transactionId: 'cached' });
      expect(mockVNPayProvider.createPayment).not.toHaveBeenCalled();
    });

    it('stores PayPal amountUsd and precise exchangeRate on the payment transaction', async () => {
      const order = {
        id: 'o1',
        totalAmount: 1000000,
        exchangeRate: 0.00004,
        displayCurrency: 'USD',
        transactions: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.payment.create.mockResolvedValue({ id: 'p1' });
      mockPayPalProvider.createPayment.mockResolvedValue({
        success: true,
        transactionId: 'pp1',
        paymentUrl: 'url',
        metadata: {
          amountUsd: 40,
          exchangeRate: 0.00004,
        },
      });

      await service.createPayment('o1', PaymentMethodEnum.PAYPAL);

      expect(mockPrismaService.paymentTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amountUsd: expect.objectContaining({ toString: expect.any(Function) }),
          exchangeRate: expect.objectContaining({ toString: expect.any(Function) }),
        }),
      });
      const data = mockPrismaService.paymentTransaction.create.mock.calls[0][0].data;
      expect(data.amountUsd.toString()).toBe('40');
      expect(data.exchangeRate.toString()).toBe('0.00004');
    });
  });

  describe('processCallback', () => {
    it('compares PayPal callback amount against stored USD amount, not VND total', async () => {
      mockPayPalProvider.verifyCallback.mockResolvedValue({
        orderId: 'o1',
        transactionId: 'pp1',
        amount: 40,
        status: TransactionStatus.SUCCESS,
        paymentMethod: PaymentMethodEnum.PAYPAL,
        gatewayResponse: { captureId: 'cap1' },
      });
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue({
        id: 'tx-internal',
        orderId: 'o1',
        paymentId: 'p1',
        amount: 1000000,
        amountUsd: 40,
        exchangeRate: 0.00004,
        providerTransactionId: 'pp1',
        gatewayResponse: {},
        payment: {
          id: 'p1',
          orderId: 'o1',
          status: PaymentProcessingStatus.INIT,
        },
      });
      mockPrismaService.paymentTransaction.findMany.mockResolvedValue([
        { status: TransactionStatusEnum.success },
      ]);
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'o1',
        retryCount: 0,
      });

      await expect(
        service.processCallback(PaymentMethodEnum.PAYPAL, { id: 'pp1' }),
      ).resolves.toBeDefined();

      expect(mockOrderPaymentService.confirmOrder).toHaveBeenCalledWith('o1', mockPrismaService);
      expect(mockLedgerIntegration.recordOrderPayment).toHaveBeenCalledWith(
        'o1',
        1000000,
        mockPrismaService,
      );
    });

    it('rejects PayPal callback when USD amount does not match stored amountUsd', async () => {
      mockPayPalProvider.verifyCallback.mockResolvedValue({
        orderId: 'o1',
        transactionId: 'pp1',
        amount: 41,
        status: TransactionStatus.SUCCESS,
        paymentMethod: PaymentMethodEnum.PAYPAL,
        gatewayResponse: {},
      });
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue({
        id: 'tx-internal',
        orderId: 'o1',
        amount: 1000000,
        amountUsd: 40,
        exchangeRate: 0.00004,
        providerTransactionId: 'pp1',
        payment: {
          id: 'p1',
          orderId: 'o1',
          status: PaymentProcessingStatus.INIT,
        },
      });

      await expect(service.processCallback(PaymentMethodEnum.PAYPAL, {})).rejects.toThrow(
        'Amount mismatch detected.',
      );
    });
  });

  describe('processRefund', () => {
    it('processes refund and restores inventory to original warehouses from logs', async () => {
      const order = {
        id: 'o1',
        totalAmount: 1000,
        transactions: [
          {
            type: TransactionTypeEnum.payment,
            status: TransactionStatusEnum.success,
            provider: PaymentMethodEnum.VNPAY,
            method: PaymentMethodEnum.VNPAY,
            transactionCode: 'tx-old',
          },
        ],
        items: [{ productVariantId: 'v1', quantity: 2 }],
      };

      const mockLogs = [
        { inventoryItemId: 'inv1', productVariantId: 'v1', warehouseId: 'w1', quantityChange: -1 },
        { inventoryItemId: 'inv2', productVariantId: 'v1', warehouseId: 'w2', quantityChange: -1 },
      ];

      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 'p1',
        status: PaymentProcessingStatus.SUCCESS,
      });
      mockVNPayProvider.processRefund.mockResolvedValue({
        success: true,
        refundTransactionId: 'ref-1',
      });
      mockPrismaService.inventoryLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.inventoryItem.findUnique
        .mockResolvedValueOnce({ id: 'inv1', quantity: 10, warehouseId: 'w1' })
        .mockResolvedValueOnce({ id: 'inv2', quantity: 5, warehouseId: 'w2' });

      const result = await service.processRefund('o1', 1000, 'test refund', true);

      expect(result.success).toBe(true);
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'inv1' } }),
      );
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'inv2' } }),
      );
    });
  });
});
