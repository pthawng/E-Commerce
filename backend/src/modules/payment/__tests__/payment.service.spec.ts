import { PaginationService } from '@common/pagination';
import { LedgerIntegrationService } from '@modules/ledger/ledger-integration.service';
import { OrderPaymentService } from '@modules/order/services/order-payment.service';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderStatusEnum,
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
import { WebhookIdempotencyService } from '../services/webhook-idempotency.service';
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
    inventoryBalance: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventoryLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    cart: {
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockIdempotencyService = {
    generatePaymentKey: jest.fn().mockReturnValue('key'),
    getResult: jest.fn().mockResolvedValue(null),
    storeResult: jest.fn(),
    acquireLock: jest.fn().mockResolvedValue('token'),
    releaseLock: jest.fn(),
  };

  const mockWebhookIdempotencyService = {
    startProcessing: jest.fn().mockResolvedValue(true),
    complete: jest.fn(),
    fail: jest.fn(),
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
        { provide: WebhookIdempotencyService, useValue: mockWebhookIdempotencyService },
        { provide: PaymentStateMachine, useValue: mockStateMachine },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: PaginationService, useValue: {} },
        { provide: LedgerIntegrationService, useValue: mockLedgerIntegration },
        { provide: OrderPaymentService, useValue: mockOrderPaymentService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));
    mockPrismaService.$queryRaw.mockResolvedValue([]);
    mockIdempotencyService.getResult.mockResolvedValue(null);
    mockIdempotencyService.acquireLock.mockResolvedValue('token');
    mockWebhookIdempotencyService.startProcessing.mockResolvedValue(true);
    mockPrismaService.inventoryLog.findFirst.mockResolvedValue(null);
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
      expect(mockOrderPaymentService.confirmOrder).not.toHaveBeenCalled();
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });

    it('rejects callback when provider order reference does not match internal transaction', async () => {
      mockVNPayProvider.verifyCallback.mockResolvedValue({
        orderId: 'wrong-order',
        transactionId: 'vnpay-tx-1',
        amount: 1000,
        status: TransactionStatus.SUCCESS,
        paymentMethod: PaymentMethodEnum.VNPAY,
        gatewayResponse: {},
      });
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue({
        id: 'tx-internal',
        orderId: 'o1',
        amount: 1000,
        currency: 'VND',
        providerTransactionId: 'vnpay-tx-1',
        payment: {
          id: 'p1',
          orderId: 'o1',
          status: PaymentProcessingStatus.INIT,
        },
      });

      await expect(service.processCallback(PaymentMethodEnum.VNPAY, {})).rejects.toThrow(
        'Order reference mismatch detected.',
      );
      expect(mockOrderPaymentService.confirmOrder).not.toHaveBeenCalled();
      expect(mockPrismaService.paymentTransaction.update).not.toHaveBeenCalled();
    });

    it('rejects callback when gateway currency does not match internal transaction currency', async () => {
      mockVNPayProvider.verifyCallback.mockResolvedValue({
        orderId: 'o1',
        transactionId: 'vnpay-tx-1',
        amount: 1000,
        status: TransactionStatus.SUCCESS,
        paymentMethod: PaymentMethodEnum.VNPAY,
        gatewayResponse: { currency: 'USD' },
      });
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue({
        id: 'tx-internal',
        orderId: 'o1',
        amount: 1000,
        currency: 'VND',
        providerTransactionId: 'vnpay-tx-1',
        payment: {
          id: 'p1',
          orderId: 'o1',
          status: PaymentProcessingStatus.INIT,
        },
      });

      await expect(service.processCallback(PaymentMethodEnum.VNPAY, {})).rejects.toThrow(
        'Currency mismatch detected.',
      );
      expect(mockOrderPaymentService.confirmOrder).not.toHaveBeenCalled();
      expect(mockPrismaService.paymentTransaction.update).not.toHaveBeenCalled();
    });

    it('does not process a replayed webhook that is already complete', async () => {
      mockVNPayProvider.verifyCallback.mockResolvedValue({
        orderId: 'o1',
        transactionId: 'vnpay-tx-1',
        amount: 1000,
        status: TransactionStatus.SUCCESS,
        paymentMethod: PaymentMethodEnum.VNPAY,
        gatewayResponse: {},
      });
      mockWebhookIdempotencyService.startProcessing.mockResolvedValue(false);

      const result = await service.processCallback(PaymentMethodEnum.VNPAY, {});

      expect(result.transactionId).toBe('vnpay-tx-1');
      expect(mockIdempotencyService.acquireLock).not.toHaveBeenCalled();
      expect(mockPrismaService.paymentTransaction.findFirst).not.toHaveBeenCalled();
      expect(mockOrderPaymentService.confirmOrder).not.toHaveBeenCalled();
      expect(mockLedgerIntegration.recordOrderPayment).not.toHaveBeenCalled();
    });

    it('rolls back orchestration when payment success targets a non-payable order', async () => {
      mockVNPayProvider.verifyCallback.mockResolvedValue({
        orderId: 'o1',
        transactionId: 'vnpay-tx-1',
        amount: 1000,
        status: TransactionStatus.SUCCESS,
        paymentMethod: PaymentMethodEnum.VNPAY,
        gatewayResponse: {},
      });
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue({
        id: 'tx-internal',
        orderId: 'o1',
        amount: 1000,
        currency: 'VND',
        providerTransactionId: 'vnpay-tx-1',
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
        status: OrderStatusEnum.CANCELLED,
        retryCount: 0,
      });
      mockOrderPaymentService.confirmOrder.mockRejectedValueOnce(
        new ConflictException('Cannot confirm payment for order=o1 in status=CANCELLED'),
      );

      await expect(service.processCallback(PaymentMethodEnum.VNPAY, {})).rejects.toThrow(
        ConflictException,
      );
      expect(mockLedgerIntegration.recordOrderPayment).not.toHaveBeenCalled();
      expect(mockWebhookIdempotencyService.fail).toHaveBeenCalled();
    });
  });

  describe('confirmVietQRPayment', () => {
    it('locks the order and skips an already confirmed order', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ id: 'o1' }]);
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'o1',
        totalAmount: 1000,
        paymentStatus: 'paid',
        status: 'CONFIRMED',
        transactions: [],
      });

      await service.confirmVietQRPayment('o1', 1000, 'admin-1');

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(mockPrismaService.payment.findFirst).not.toHaveBeenCalled();
      expect(mockOrderPaymentService.confirmOrder).not.toHaveBeenCalled();
    });

    it('rejects manual VietQR confirmation with a mismatched amount', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ id: 'o1' }]);
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'o1',
        totalAmount: 1000,
        paymentStatus: 'unpaid',
        status: 'PENDING_PAYMENT',
        transactions: [],
      });

      await expect(service.confirmVietQRPayment('o1', 900, 'admin-1')).rejects.toThrow(
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
        {
          inventoryBalanceId: 'bal1',
          productVariantId: 'v1',
          warehouseId: 'w1',
          quantityChange: -1,
        },
        {
          inventoryBalanceId: 'bal2',
          productVariantId: 'v1',
          warehouseId: 'w2',
          quantityChange: -1,
        },
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
      mockPrismaService.inventoryBalance.findUnique
        .mockResolvedValueOnce({ id: 'bal1', quantity: 10, warehouseId: 'w1' })
        .mockResolvedValueOnce({ id: 'bal2', quantity: 5, warehouseId: 'w2' });

      const result = await service.processRefund('o1', 1000, 'test refund', true);

      expect(result.success).toBe(true);
      expect(mockPrismaService.inventoryBalance.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.inventoryBalance.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'bal1' } }),
      );
      expect(mockPrismaService.inventoryBalance.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'bal2' } }),
      );
    });

    it('does not restore inventory twice when a prior restoration log exists', async () => {
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

      mockPrismaService.order.findUnique.mockResolvedValue(order);
      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 'p1',
        status: PaymentProcessingStatus.SUCCESS,
      });
      mockVNPayProvider.processRefund.mockResolvedValue({
        success: true,
        refundTransactionId: 'ref-1',
      });
      mockPrismaService.inventoryLog.findFirst.mockResolvedValue({ id: 'return-log-1' });

      const result = await service.processRefund('o1', 1000, 'duplicate restore guard', true);

      expect(result.success).toBe(true);
      expect(mockPrismaService.inventoryLog.findMany).not.toHaveBeenCalled();
      expect(mockPrismaService.inventoryBalance.update).not.toHaveBeenCalled();
      expect(mockPrismaService.inventoryLog.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ actionType: 'RETURN' }),
        }),
      );
    });
  });
});
