import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryAllocatorService } from '../inventory-allocator.service';

describe('InventoryAllocatorService', () => {
  let service: InventoryAllocatorService;
  let prisma: PrismaService;

  const mockPrismaService = {
    inventoryItem: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryAllocatorService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InventoryAllocatorService>(InventoryAllocatorService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('allocate', () => {
    const variantId = 'v1';
    const items = [{ variantId, quantity: 10 }];

    it('should allocate from a single warehouse if stock is sufficient', async () => {
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([
        { warehouseId: 'w1', quantity: 20, reservedQuantity: 0, warehouse: { name: 'W1' } },
      ]);

      const result = await service.allocate(items);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ variantId, warehouseId: 'w1', quantity: 10 });
    });

    it('should split allocation across multiple warehouses (Largest-Stock-First)', async () => {
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([
        { warehouseId: 'w1', quantity: 8, reservedQuantity: 0, warehouse: { name: 'W1' } },
        { warehouseId: 'w2', quantity: 15, reservedQuantity: 0, warehouse: { name: 'W2' } },
        { warehouseId: 'w3', quantity: 3, reservedQuantity: 0, warehouse: { name: 'W3' } },
      ]);

      const result = await service.allocate(items);

      // Should pick w2 (15) first, which covers all 10
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ variantId, warehouseId: 'w2', quantity: 10 });
    });

    it('should split allocation when one warehouse is not enough', async () => {
      const largeRequest = [{ variantId, quantity: 20 }];
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([
        { warehouseId: 'w1', quantity: 15, reservedQuantity: 0, warehouse: { name: 'W1' } },
        { warehouseId: 'w2', quantity: 10, reservedQuantity: 0, warehouse: { name: 'W2' } },
      ]);

      const result = await service.allocate(largeRequest);

      expect(result).toHaveLength(2);
      // Sorted desc: w1 (15), w2 (10)
      expect(result[0]).toEqual({ variantId, warehouseId: 'w1', quantity: 15 });
      expect(result[1]).toEqual({ variantId, warehouseId: 'w2', quantity: 5 });
    });

    it('should throw ConflictException if total stock is insufficient', async () => {
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([
        { warehouseId: 'w1', quantity: 5, reservedQuantity: 0, warehouse: { name: 'W1' } },
      ]);

      await expect(service.allocate(items)).rejects.toThrow(ConflictException);
    });

    it('should ignore warehouses with no available stock', async () => {
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([
        { warehouseId: 'w1', quantity: 10, reservedQuantity: 10, warehouse: { name: 'W1' } },
        { warehouseId: 'w2', quantity: 15, reservedQuantity: 0, warehouse: { name: 'W2' } },
      ]);

      const result = await service.allocate(items);

      expect(result).toHaveLength(1);
      expect(result[0].warehouseId).toBe('w2');
      expect(result[0].quantity).toBe(10);
    });
  });
});
