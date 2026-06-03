import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SystemSettingService } from '../../system/system-setting.service';
import { InventoryService } from '../inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  const mockPrismaService = {
    inventoryBalance: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    inventoryReservation: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    inventoryLog: {
      create: jest.fn(),
    },
    inventoryAuditLog: {
      create: jest.fn(),
    },
    physicalItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: SystemSettingService,
          useValue: { getNumber: jest.fn().mockResolvedValue(5) },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
    mockPrismaService.inventoryReservation.findMany.mockResolvedValue([]);
  });

  describe('checkAvailability', () => {
    it('should return true if aggregate stock is sufficient', async () => {
      mockPrismaService.inventoryBalance.findMany.mockResolvedValue([
        { quantity: 10, reservedQuantity: 2 },
        { quantity: 5, reservedQuantity: 0 },
      ]);

      const result = await service.checkAvailability('v1', 10);
      expect(result.available).toBe(true);
      expect(result.totalAvailable).toBe(13);
    });

    it('should return false if aggregate stock is insufficient', async () => {
      mockPrismaService.inventoryBalance.findMany.mockResolvedValue([
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
      mockPrismaService.$queryRaw.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 0, damagedQuantity: 0 },
      ]);
      mockPrismaService.inventoryReservation.create.mockResolvedValue({ id: 'res1' });

      const result = await service.reserve('order1', allocations, expiresAt);

      expect(result).toEqual(['res1']);
      expect(mockPrismaService.inventoryBalance.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { reservedQuantity: { increment: 5 } },
      });
    });

    it('should throw ConflictException if insufficient stock in warehouse', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 7, damagedQuantity: 0 },
      ]);

      await expect(service.reserve('order1', allocations, expiresAt)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should fail if lock-time availability is stale even when plan was precomputed', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        { id: 'inv1', quantity: 5, reservedQuantity: 4, damagedQuantity: 0 },
      ]);

      await expect(service.reserve('order1', allocations, expiresAt)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.inventoryReservation.create).not.toHaveBeenCalled();
      expect(mockPrismaService.inventoryLog.create).not.toHaveBeenCalled();
    });

    it('should return existing active reservations without double-writing stock or logs', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res1', status: ReservationStatus.active },
      ]);

      const result = await service.reserve('order1', allocations, expiresAt);

      expect(result).toEqual(['res1']);
      expect(mockPrismaService.inventoryBalance.update).not.toHaveBeenCalled();
      expect(mockPrismaService.inventoryReservation.create).not.toHaveBeenCalled();
      expect(mockPrismaService.inventoryLog.create).not.toHaveBeenCalled();
    });

    it('should include damaged stock in lock-time availability checks', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 2, damagedQuantity: 4 },
      ]);

      await expect(service.reserve('order1', allocations, expiresAt)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deduct', () => {
    it('should decrease quantity and reservedQuantity', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        {
          id: 'res1',
          productVariantId: 'v1',
          warehouseId: 'w1',
          quantity: 5,
          status: ReservationStatus.active,
          expiresAt: new Date(Date.now() + 60_000),
        },
      ]);
      mockPrismaService.$queryRaw.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 5, damagedQuantity: 0 },
      ]);

      await service.deduct('order1');

      expect(mockPrismaService.inventoryBalance.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: {
          quantity: { decrement: 5 },
          reservedQuantity: { decrement: 5 },
        },
      });
      expect(mockPrismaService.inventoryReservation.update).toHaveBeenCalledWith({
        where: { id: 'res1' },
        data: { status: ReservationStatus.confirmed },
      });
    });

    it('should be idempotent when reservation is already confirmed', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res1', status: ReservationStatus.confirmed },
      ]);

      await service.deduct('order1');

      expect(mockPrismaService.inventoryBalance.update).not.toHaveBeenCalled();
      expect(mockPrismaService.inventoryLog.create).not.toHaveBeenCalled();
    });

    it('should reject committing an expired active reservation', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        {
          id: 'res1',
          productVariantId: 'v1',
          warehouseId: 'w1',
          quantity: 5,
          status: ReservationStatus.active,
          expiresAt: new Date(Date.now() - 60_000),
        },
      ]);

      await expect(service.deduct('order1')).rejects.toThrow(ConflictException);
      expect(mockPrismaService.inventoryBalance.update).not.toHaveBeenCalled();
    });

    it('should reject committing a released reservation', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res1', status: ReservationStatus.released },
      ]);

      await expect(service.deduct('order1')).rejects.toThrow(ConflictException);
    });
  });

  describe('release', () => {
    it('should decrease reservedQuantity and mark status as released', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        {
          id: 'res1',
          productVariantId: 'v1',
          warehouseId: 'w1',
          quantity: 5,
          status: ReservationStatus.active,
        },
      ]);
      mockPrismaService.$queryRaw.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 5, damagedQuantity: 0 },
      ]);

      await service.release('order1');

      expect(mockPrismaService.inventoryBalance.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: {
          reservedQuantity: { decrement: 5 },
        },
      });
      expect(mockPrismaService.inventoryReservation.update).toHaveBeenCalledWith({
        where: { id: 'res1' },
        data: { status: ReservationStatus.released },
      });
    });

    it('should be idempotent when reservation is already released', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res1', status: ReservationStatus.released },
      ]);

      await service.release('order1');

      expect(mockPrismaService.inventoryBalance.update).not.toHaveBeenCalled();
      expect(mockPrismaService.inventoryLog.create).not.toHaveBeenCalled();
    });

    it('should reject release after commit', async () => {
      mockPrismaService.inventoryReservation.findMany.mockResolvedValue([
        { id: 'res1', status: ReservationStatus.confirmed },
      ]);

      await expect(service.release('order1')).rejects.toThrow(ConflictException);
      expect(mockPrismaService.inventoryBalance.update).not.toHaveBeenCalled();
    });
  });

  describe('receiveStock', () => {
    it('should increment stock and log IMPORT action', async () => {
      mockPrismaService.inventoryBalance.upsert.mockResolvedValue({ id: 'inv1', quantity: 15 });

      await service.receiveStock('v1', 'w1', 5);

      expect(mockPrismaService.inventoryBalance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: {
            productVariantId: 'v1',
            warehouseId: 'w1',
            quantity: 5,
          },
          update: {
            quantity: { increment: 5 },
          },
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
      mockPrismaService.$queryRaw.mockResolvedValue([
        { id: 'inv1', quantity: 10, reservedQuantity: 0, damagedQuantity: 0, inTransitQuantity: 0 },
      ]);

      await service.adjustStock('v1', 'w1', 25, 'Physical count');

      expect(mockPrismaService.inventoryBalance.update).toHaveBeenCalledWith(
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
