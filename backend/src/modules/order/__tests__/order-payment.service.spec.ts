import { BadRequestException } from '@nestjs/common';
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
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockPaymentService = {
    generatePaymentUrl: jest.fn(),
  };

  const mockInventoryService = {
    reserve: jest.fn(),
    release: jest.fn(),
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
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('order-token') } },
        { provide: CurrencyService, useValue: { getRate: jest.fn().mockResolvedValue(1) } },
        { provide: PriceEngineService, useValue: mockPriceEngine },
        { provide: CheckoutValidator, useValue: mockCheckoutValidator },
      ],
    }).compile();

    service = module.get<OrderPaymentService>(OrderPaymentService);
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
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
    mockPrisma.order.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingOrder);

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
});
