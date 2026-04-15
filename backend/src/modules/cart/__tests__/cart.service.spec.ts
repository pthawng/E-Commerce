import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { CartService } from '../cart.service';

describe('CartService', () => {
  let service: CartService;
  let prisma: PrismaService;

  const mockPrismaService = {
    cart: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: mockPrismaService }],
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

      expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cartId: 'c1',
          productVariantId: 'v1',
          quantity: 2,
          cachedPrice: 150000,
        }),
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
      const guestItems = [{ productVariantId: 'v1', quantity: 3, cachedPrice: 100 }];

      mockPrismaService.cart.findFirst
        .mockResolvedValueOnce(guestCart) // find guest cart
        .mockResolvedValueOnce(userCart); // find user cart
      mockPrismaService.cartItem.findMany.mockResolvedValue(guestItems);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null); // newItem in user cart

      await service.mergeCart('u1', 's1');

      expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cartId: 'user_c1',
          productVariantId: 'v1',
          quantity: 3,
        }),
      });
      expect(mockPrismaService.cart.delete).toHaveBeenCalledWith({ where: { id: 'guest_c1' } });
    });
  });
});
