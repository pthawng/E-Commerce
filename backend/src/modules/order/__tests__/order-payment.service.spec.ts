import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatusEnum, PaymentMethodEnum } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GuestVerificationService } from '../../auth/services/guest-verification.service';
import { InventoryAllocatorService } from '../../inventory/inventory-allocator.service';
import { InventoryService } from '../../inventory/inventory.service';
import { MailService } from '../../mail/mail.service';
import { PaymentService } from '../../payment/payment.service';
import { CurrencyService } from '../../system/currency.service';
import { SystemSettingService } from '../../system/system-setting.service';
import { CheckoutTokenService } from '../services/checkout-token.service';
import { CheckoutValidator } from '../services/checkout-validator.service';
import { OrderPaymentService } from '../services/order-payment.service';
import { PriceEngineService } from '../services/price-engine.service';

describe('OrderPaymentService', () => {
  let service: OrderPaymentService;

  const cart = {
    id: 'cart-1',
    userId: 'user-1',
    sessionId: null,
    items: [{ id: 'cart-item-1', productVariantId: 'variant-1', quantity: 1 }],
  };

  const variant = {
    id: 'variant-1',
    sku: 'SKU-1',
    price: 1000000,
    variantTitle: { vi: 'Size 6' },
    thumbnailUrl: 'thumb.jpg',
    product: { name: { vi: 'Ring' }, isActive: true },
  };

  const mockPrisma = {
    cart: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    paymentTransaction: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    orderTimeline: {
      create: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockPaymentService = {
    generatePaymentUrl: jest.fn(),
  };

  const mockInventoryService = {
    reserve: jest.fn(),
    release: jest.fn(),
    deduct: jest.fn(),
  };

  const mockInventoryAllocator = {
    allocate: jest.fn(),
  };

  const mockCheckoutTokenService = {
    verifyToken: jest.fn(),
  };

  const mockCheckoutValidator = {
    validateGuest: jest.fn(),
    validateTokenOwnership: jest.fn(),
    validateCartStability: jest.fn(),
    validatePriceStability: jest.fn(),
    generateCartHash: jest.fn(),
  };

  const mockPriceEngine = {
    calculateTotals: jest.fn(),
  };

  const mockSettings = {
    getNumber: jest.fn((key: string) => {
      const values: Record<string, number> = {
        'order.paymentTimeoutMinutes': 15,
        'order.shippingFeeVnd': 30000,
      };
      return Promise.resolve(values[key] ?? 15);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderPaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: InventoryAllocatorService, useValue: mockInventoryAllocator },
        { provide: CheckoutTokenService, useValue: mockCheckoutTokenService },
        { provide: MailService, useValue: { sendMail: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
        { provide: GuestVerificationService, useValue: {} },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('order-token') },
        },
        { provide: CurrencyService, useValue: { getRate: jest.fn().mockResolvedValue(1) } },
        { provide: PriceEngineService, useValue: mockPriceEngine },
        { provide: CheckoutValidator, useValue: mockCheckoutValidator },
        { provide: SystemSettingService, useValue: mockSettings },
      ],
    }).compile();

    service = module.get<OrderPaymentService>(OrderPaymentService);
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
    mockPrisma.$queryRaw.mockResolvedValue([]);
    mockPrisma.order.update.mockResolvedValue({ id: 'order-1', version: 2 });
    mockPrisma.orderItem.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockCheckoutTokenService.verifyToken.mockResolvedValue({
      jti: 'checkout-jti-1',
      cartHash: 'cart-hash',
      totalAmount: 1030000,
      currency: 'VND',
      lineItems: [{ variantId: 'variant-1', quantity: 1, price: 1000000 }],
      userId: 'user-1',
      expiresAt: Date.now() + 60000,
    });
    mockPrisma.cart.findFirst.mockResolvedValue(cart);
    mockPrisma.productVariant.findMany.mockResolvedValue([variant]);
    mockInventoryAllocator.allocate.mockResolvedValue([
      { variantId: 'variant-1', warehouseId: 'warehouse-1', quantity: 1 },
    ]);
    mockPriceEngine.calculateTotals.mockReturnValue({
      subtotal: 1000000,
      shipping: 30000,
      tax: 0,
      discount: 0,
      total: 1030000,
    });
    mockPrisma.order.findUnique.mockResolvedValue(null);
    mockPrisma.order.create.mockResolvedValue({
      id: 'order-1',
      code: 'ORD-1',
      status: OrderStatusEnum.PENDING_PAYMENT,
      paymentStatus: 'unpaid',
      paymentDeadline: new Date(),
      totalAmount: 1030000,
      currency: 'VND',
      createdAt: new Date(),
    });
    mockPrisma.paymentTransaction.create.mockResolvedValue({
      id: 'payment-tx-1',
      provider: PaymentMethodEnum.VNPAY,
      status: 'pending',
      transactionCode: 'TXN-1',
    });
    mockPaymentService.generatePaymentUrl.mockResolvedValue('https://pay.example/redirect');
  });

  it('uses checkout token jti as the only order idempotency key', async () => {
    await service.createOrderWithPayment(
      {
        checkoutToken: 'signed-checkout-token',
        idempotencyKey: 'client-supplied-key',
        paymentMethod: PaymentMethodEnum.VNPAY,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0900000000',
          addressDetail: '1 Test',
          wardName: 'Ward',
          districtName: 'District',
          provinceName: 'HCMC',
        },
      } as any,
      'user-1',
    );

    expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: 'checkout-jti-1' },
      include: { transactions: true },
    });
    expect(mockPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: 'checkout-jti-1',
        }),
      }),
    );
  });

  it('returns the existing order on duplicate checkout commit', async () => {
    const existingOrder = {
      id: 'order-1',
      code: 'ORD-1',
      status: OrderStatusEnum.PENDING_PAYMENT,
      paymentStatus: 'unpaid',
      paymentDeadline: new Date(),
      totalAmount: 1030000,
      currency: 'VND',
      createdAt: new Date(),
      paymentMethod: PaymentMethodEnum.VNPAY,
      transactions: [{ id: 'payment-tx-1', provider: PaymentMethodEnum.VNPAY }],
    };
    mockPrisma.order.findUnique.mockResolvedValue(existingOrder);

    const result = await service.createOrderWithPayment(
      {
        checkoutToken: 'signed-checkout-token',
        paymentMethod: PaymentMethodEnum.VNPAY,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0900000000',
          addressDetail: '1 Test',
          wardName: 'Ward',
          districtName: 'District',
          provinceName: 'HCMC',
        },
      } as any,
      'user-1',
    );

    expect(result.order.id).toBe('order-1');
    expect(mockInventoryAllocator.allocate).not.toHaveBeenCalled();
    expect(mockPrisma.order.create).not.toHaveBeenCalled();
    expect(mockPaymentService.generatePaymentUrl).toHaveBeenCalledWith(
      'order-1',
      'ORD-1',
      1030000,
      PaymentMethodEnum.VNPAY,
      undefined,
      undefined,
    );
  });

  it('recovers from a concurrent unique idempotency conflict', async () => {
    const uniqueError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    const existingOrder = {
      id: 'order-1',
      code: 'ORD-1',
      status: OrderStatusEnum.PENDING_PAYMENT,
      paymentStatus: 'unpaid',
      paymentDeadline: new Date(),
      totalAmount: 1030000,
      currency: 'VND',
      createdAt: new Date(),
      paymentMethod: PaymentMethodEnum.VNPAY,
      transactions: [{ id: 'payment-tx-1', provider: PaymentMethodEnum.VNPAY }],
    };

    mockPrisma.$transaction.mockRejectedValueOnce(uniqueError);
    mockPrisma.order.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(existingOrder);

    const result = await service.createOrderWithPayment(
      {
        checkoutToken: 'signed-checkout-token',
        paymentMethod: PaymentMethodEnum.VNPAY,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0900000000',
          addressDetail: '1 Test',
          wardName: 'Ward',
          districtName: 'District',
          provinceName: 'HCMC',
        },
      } as any,
      'user-1',
    );

    expect(result.order.id).toBe('order-1');
  });

  it('throws when a non-idempotency transaction error happens', async () => {
    mockPrisma.$transaction.mockRejectedValueOnce(new BadRequestException('boom'));

    await expect(
      service.createOrderWithPayment(
        {
          checkoutToken: 'signed-checkout-token',
          paymentMethod: PaymentMethodEnum.VNPAY,
          shippingAddress: {
            fullName: 'Test User',
            phone: '0900000000',
            addressDetail: '1 Test',
            wardName: 'Ward',
            districtName: 'District',
            provinceName: 'HCMC',
          },
        } as any,
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  describe('confirmOrder', () => {
    it('commits inventory and marks a pending unpaid order as confirmed', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'order-1',
          code: 'ORD-1',
          status: OrderStatusEnum.PENDING_PAYMENT,
          paymentStatus: 'unpaid',
          userId: null,
          guestEmail: null,
          sessionId: 'session-1',
          shippingAddress: {},
          createdAt: new Date(),
        },
      ]);

      await service.confirmOrder('order-1');

      expect(mockInventoryService.deduct).toHaveBeenCalledWith('order-1', mockPrisma);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: expect.objectContaining({
          status: OrderStatusEnum.CONFIRMED,
          paymentStatus: 'paid',
        }),
      });
      expect(mockPrisma.orderTimeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'PAYMENT_SUCCESS_CONFIRMED' }),
        }),
      );
    });

    it('is idempotent when the order is already confirmed', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatusEnum.CONFIRMED,
          paymentStatus: 'paid',
        },
      ]);

      await service.confirmOrder('order-1');

      expect(mockInventoryService.deduct).not.toHaveBeenCalled();
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('blocks payment confirmation for a cancelled order', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatusEnum.CANCELLED,
          paymentStatus: 'unpaid',
        },
      ]);

      await expect(service.confirmOrder('order-1')).rejects.toThrow(ConflictException);
      expect(mockInventoryService.deduct).not.toHaveBeenCalled();
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('releases inventory once and fails pending payment transactions for unpaid orders', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatusEnum.PENDING_PAYMENT,
          paymentStatus: 'unpaid',
        },
      ]);

      await service.cancelOrder('order-1', 'Customer requested', 'admin-1');

      expect(mockInventoryService.release).toHaveBeenCalledWith('order-1', mockPrisma);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: expect.objectContaining({
          status: OrderStatusEnum.CANCELLED,
          cancelReason: 'Customer requested',
        }),
      });
      expect(mockPrisma.paymentTransaction.updateMany).toHaveBeenCalledWith({
        where: { orderId: 'order-1', status: 'pending' },
        data: { status: 'failed' },
      });
    });

    it('is idempotent when order is already cancelled', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatusEnum.CANCELLED,
          paymentStatus: 'unpaid',
        },
      ]);

      await service.cancelOrder('order-1', 'Already cancelled');

      expect(mockInventoryService.release).not.toHaveBeenCalled();
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('does not release inventory for a confirmed paid order', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'order-1',
          status: OrderStatusEnum.CONFIRMED,
          paymentStatus: 'paid',
        },
      ]);

      await expect(service.cancelOrder('order-1', 'Late cancel')).rejects.toThrow(
        ConflictException,
      );
      expect(mockInventoryService.release).not.toHaveBeenCalled();
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });
  });
});
