import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getToken } from '@willsoto/nestjs-prometheus';
import { PrismaService } from 'src/prisma/prisma.service';
import { CartService } from '../cart.service';

describe('CartService', () => {
  let service: CartService;
  let prisma: PrismaService;

  const mockPrismaService = {
    cart: {
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'c1', version: 1 }),
      update: jest.fn().mockResolvedValue({ id: 'c1', version: 1 }),
      findUnique: jest.fn().mockResolvedValue({ id: 'c1', version: 1 }),
      delete: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ id: 'ci1', quantity: 2 }),
      deleteMany: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
    $executeRaw: jest.fn().mockResolvedValue(undefined),
  };

  const mockConflictCounter = {
    inc: jest.fn(),
  };

  const mockDurationHistogram = {
    startTimer: jest.fn().mockReturnValue(jest.fn()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: getToken('cart_concurrency_conflicts_total'),
          useValue: mockConflictCounter,
        },
        {
          provide: getToken('cart_operation_duration_seconds'),
          useValue: mockDurationHistogram,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('addToCart', () => {
    const dto = { variantId: 'v1', quantity: 2 };

    it('should add item to cart with snapshot price', async () => {
      const variant = {
        id: 'v1',
        isActive: true,
        price: 150000,
        product: { isActive: true },
        inventoryItems: [{ quantity: 10, reservedQuantity: 0 }],
      };
      mockPrismaService.productVariant.findUnique.mockResolvedValue(variant);
      mockPrismaService.cart.findFirst.mockResolvedValue({ id: 'c1' });
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);

      await service.addToCart('u1', undefined, dto);

      expect(mockPrismaService.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cartId_productVariantId: { cartId: 'c1', productVariantId: 'v1' },
        },
        update: {
          quantity: { increment: 2 },
          cachedPrice: 150000,
          addedAt: expect.any(Date),
        },
        create: {
          cartId: 'c1',
          productVariantId: 'v1',
          quantity: 2,
          cachedPrice: 150000,
          currency: 'VND',
        },
      });
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      const variant = {
        id: 'v1',
        isActive: true,
        product: { isActive: true },
        inventoryItems: [{ quantity: 5, reservedQuantity: 4 }], // Only 1 available
      };
      mockPrismaService.productVariant.findUnique.mockResolvedValue(variant);

      await expect(service.addToCart('u1', undefined, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('mergeCart', () => {
    it('should merge guest items into user cart', async () => {
      const guestCart = { id: 'guest_c1' };
      const userCart = { id: 'user_c1' };
      const guestItems = [
        {
          productVariantId: 'v1',
          quantity: 3,
          cachedPrice: 100,
          productVariant: { inventoryItems: [{ quantity: 10, reservedQuantity: 0 }] },
        },
      ];

      mockPrismaService.cart.findFirst
        .mockResolvedValueOnce(guestCart) // find guest cart
        .mockResolvedValueOnce(userCart); // find user cart
      mockPrismaService.cart.update.mockResolvedValue({ id: 'user_c1', version: 1 });
      mockPrismaService.cartItem.findMany.mockResolvedValue(guestItems);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null); // newItem in user cart
      mockPrismaService.productVariant.findMany.mockResolvedValue([
        {
          id: 'v1',
          productId: 'p1',
          price: 100,
          isActive: true,
          product: { isActive: true, name: { en: 'V1 Product' }, slug: 'v1-product' },
          inventoryItems: [{ quantity: 10, reservedQuantity: 0 }],
        },
      ]);

      await service.mergeCart('u1', 's1');

      expect(mockPrismaService.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cartId_productVariantId: { cartId: 'user_c1', productVariantId: 'v1' },
        },
        update: {
          quantity: { increment: 3 },
        },
        create: {
          cartId: 'user_c1',
          productVariantId: 'v1',
          quantity: 3,
          cachedPrice: 100,
          currency: undefined,
          taxRate: undefined,
          discountSnapshot: undefined,
        },
      });
      expect(mockPrismaService.cart.delete).toHaveBeenCalledWith({ where: { id: 'guest_c1' } });
    });
  });
});
