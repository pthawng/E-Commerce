import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

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
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
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

      await expect(service.reserve('order1', allocations, expiresAt))
        .rejects.toThrow(ConflictException);
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
});
