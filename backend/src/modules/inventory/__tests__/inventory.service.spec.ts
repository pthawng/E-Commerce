import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryService } from '../inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  const mockPrismaService = {
    inventoryItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    inventoryReservation: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    inventoryLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should return true if aggregate stock is sufficient', async () => {
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([
        { quantity: 10, reservedQuantity: 2 },
        { quantity: 5, reservedQuantity: 0 },
      ]);

      const result = await service.checkAvailability('v1', 10);
      expect(result.available).toBe(true);
      expect(result.totalAvailable).toBe(13);
    });

    it('should return false if aggregate stock is insufficient', async () => {
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([
        { quantity: 5, reservedQuantity: 2 },
      ]);

      const result = await service.checkAvailability('v1', 10);
      expect(result.available).toBe(false);
    });
  });

  describe('reserve', () => {
    const allocations = [{ variantId: 'v1', warehouseId: 'w1', quantity: 5 }];
    const expiresAt = new Date();

    it('should successfully reserve stock', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 0 },
      ]);
      mockPrismaService.inventoryReservation.create.mockResolvedValue({ id: 'res1' });

      const result = await service.reserve('order1', allocations, expiresAt);

      expect(result).toEqual(['res1']);
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { reservedQuantity: { increment: 5 } },
      });
    });

    it('should throw ConflictException if insufficient stock in warehouse', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 7 },
      ]);

      await expect(service.reserve('order1', allocations, expiresAt)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deduct', () => {
    it('should decrease quantity and reservedQuantity', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res1', variantId: 'v1', warehouseId: 'w1', quantity: 5 },
      ]);
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 5 },
      ]);

      await service.deduct('order1');

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { quantity: 5, reservedQuantity: 0 },
      });
      expect(mockPrismaService.inventoryReservation.update).toHaveBeenCalledWith({
        where: { id: 'res1' },
        data: { status: 'confirmed' },
      });
    });
  });

  describe('release', () => {
    it('should decrease reservedQuantity and mark status as released', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res1', variantId: 'v1', warehouseId: 'w1', quantity: 5 },
      ]);
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 5 },
      ]);

      await service.release('order1');

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { reservedQuantity: 0 },
      });
      expect(mockPrismaService.inventoryReservation.update).toHaveBeenCalledWith({
        where: { id: 'res1' },
        data: { status: 'released' },
      });
    });
  });

  describe('directDeduct', () => {
    it('should deduct stock directly without prior reservation (COD)', async () => {
      const allocations = [{ variantId: 'v1', warehouseId: 'w1', quantity: 3 }];
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 0 },
      ]);

      await service.directDeduct('order_cod', allocations);

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantity: 7 },
        }),
      );
    });
  });

  describe('receiveStock', () => {
    it('should increment stock and log IMPORT action', async () => {
      mockPrismaService.inventoryItem.findUnique.mockResolvedValue({ id: 'inv1', quantity: 10 });

      await service.receiveStock('v1', 'w1', 5);

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantity: 15 },
        }),
      );
      expect(mockPrismaService.inventoryLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ actionType: 'IMPORT', quantityChange: 5 }),
        }),
      );
    });
  });

  describe('adjustStock', () => {
    it('should set stock to exact quantity and log ADJUSTMENT', async () => {
      mockPrismaService.inventoryItem.findUnique.mockResolvedValue({ id: 'inv1', quantity: 10 });

      await service.adjustStock('v1', 'w1', 25, 'Physical count');

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantity: 25 },
        }),
      );
      expect(mockPrismaService.inventoryLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ actionType: 'ADJUSTMENT', quantityChange: 15 }),
        }),
      );
    });
  });
});
