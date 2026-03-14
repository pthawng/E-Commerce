import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderService } from '../order.service';

describe('OrderService (Integration)', () => {
  let service: OrderService;
  let prisma: PrismaService;

  const mockPrismaService = {
    cart: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
    inventoryItem: {
      update: jest.fn(),
    },
    inventoryLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const userId = 'user1';
    const dto = {
      shippingAddress: { fullName: 'John Doe', address: '123 St' },
      paymentMethod: 'COD',
    };

    it('should successfully create an order and deduct inventory', async () => {
      const cart = {
        id: 'c1',
        items: [{ productVariantId: 'v1', quantity: 2, cachedPrice: 100 }],
      };
      const variants = [{
        id: 'v1',
        sku: 'SKU1',
        isActive: true,
        price: 100,
        product: { isActive: true, name: { vi: 'Product' } },
        inventoryItems: [{ id: 'i1', quantity: 10, reservedQuantity: 0, warehouseId: 'w1' }],
      }];

      mockPrismaService.cart.findFirst.mockResolvedValue(cart);
      mockPrismaService.productVariant.findMany.mockResolvedValue(variants);
      mockPrismaService.order.create.mockResolvedValue({ id: 'o1', code: 'ORD-123' });

      const result = await service.createOrder(userId, undefined, dto as any);

      expect(result.id).toBe('o1');
      expect(mockPrismaService.order.create).toHaveBeenCalled();
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'i1' },
        data: { quantity: { decrement: 2 } },
      });
      expect(mockPrismaService.cart.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('should throw BadRequestException if cart is empty', async () => {
      mockPrismaService.cart.findFirst.mockResolvedValue(null);

      await expect(service.createOrder(userId, undefined, dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      const cart = {
        id: 'c1',
        items: [{ productVariantId: 'v1', quantity: 20, cachedPrice: 100 }],
      };
      const variants = [{
        id: 'v1',
        sku: 'SKU1',
        isActive: true,
        price: 100,
        product: { isActive: true },
        inventoryItems: [{ id: 'i1', quantity: 10, reservedQuantity: 0 }],
      }];

      mockPrismaService.cart.findFirst.mockResolvedValue(cart);
      mockPrismaService.productVariant.findMany.mockResolvedValue(variants);

      await expect(service.createOrder(userId, undefined, dto as any)).rejects.toThrow(BadRequestException);
    });
  });
});
