import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { StockMovementService } from '../stock-movement.service';

describe('StockMovementService', () => {
  let service: StockMovementService;
  let prisma: PrismaService;

  const mockPrismaService = {
    inventoryItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    inventoryTransfer: {
      create: jest.fn().mockResolvedValue({ id: 'trf1' }),
      findUnique: jest.fn().mockResolvedValue({
        id: 'trf1',
        variantId: 'v1',
        fromWarehouseId: 'w1',
        toWarehouseId: 'w2',
        quantity: 10,
        status: 'PENDING',
        fromWarehouse: { name: 'Warehouse 1' },
        toWarehouse: { name: 'Warehouse 2' },
      }),
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
      providers: [StockMovementService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<StockMovementService>(StockMovementService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('transfer', () => {
    const transferParams = {
      variantId: 'v1',
      fromWarehouseId: 'w1',
      toWarehouseId: 'w2',
      quantity: 10,
    };

    it('should successfully transfer stock between warehouses', async () => {
      // Source warehouse has enough stock
      mockPrismaService.$queryRawUnsafe
        .mockResolvedValueOnce([
          { id: 'inv1', quantity: 50, reservedQuantity: 0, damagedQuantity: 0 },
        ]) // from
        .mockResolvedValueOnce([{ id: 'inv2', quantity: 20, inTransitQuantity: 10 }]); // to

      mockPrismaService.inventoryTransfer.create.mockResolvedValue({ id: 'trf1' });
      mockPrismaService.inventoryTransfer.findUnique
        .mockResolvedValueOnce({
          id: 'trf1',
          variantId: 'v1',
          fromWarehouseId: 'w1',
          toWarehouseId: 'w2',
          quantity: 10,
          status: 'PENDING',
          fromWarehouse: { name: 'Warehouse 1' },
          toWarehouse: { name: 'Warehouse 2' },
        })
        .mockResolvedValueOnce({
          id: 'trf1',
          variantId: 'v1',
          fromWarehouseId: 'w1',
          toWarehouseId: 'w2',
          quantity: 10,
          status: 'SHIPPED',
          fromWarehouse: { name: 'Warehouse 1' },
          toWarehouse: { name: 'Warehouse 2' },
        });

      mockPrismaService.inventoryTransfer.update.mockResolvedValue({ id: 'trf1' });
      mockPrismaService.inventoryItem.upsert.mockResolvedValue({ id: 'inv2' });

      await service.transfer(
        transferParams.variantId,
        transferParams.fromWarehouseId,
        transferParams.toWarehouseId,
        transferParams.quantity,
      );

      // Verify source deduction
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { quantity: { decrement: 10 } },
      });

      // Verify destination addition
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'inv2' },
        data: {
          inTransitQuantity: { decrement: 10 },
          quantity: { increment: 10 },
        },
      });

      // Verify InventoryTransfer record
      expect(mockPrismaService.inventoryTransfer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: 'v1',
          fromWarehouseId: 'w1',
          toWarehouseId: 'w2',
          quantity: 10,
        }),
      });

      // Verify logs
      expect(mockPrismaService.inventoryLog.create).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if source and destination are same', async () => {
      await expect(service.transfer('v1', 'w1', 'w1', 10)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if source stock is insufficient', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValueOnce([
        { id: 'inv1', quantity: 5, reservedQuantity: 0 },
      ]);

      await expect(service.transfer('v1', 'w1', 'w2', 10)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if internal record not found', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValueOnce([]); // from not found

      await expect(service.transfer('v1', 'w1', 'w2', 10)).rejects.toThrow(NotFoundException);
    });
  });
});
