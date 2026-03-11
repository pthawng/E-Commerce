import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementService } from '../stock-movement.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StockMovementService', () => {
  let service: StockMovementService;
  let prisma: PrismaService;

  const mockPrismaService = {
    inventoryItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    inventoryTransfer: {
      create: jest.fn(),
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
        StockMovementService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
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
        .mockResolvedValueOnce([{ id: 'inv1', quantity: 50, reservedQuantity: 0 }]) // from
        .mockResolvedValueOnce([{ id: 'inv2', quantity: 20, reservedQuantity: 0 }]); // to

      mockPrismaService.inventoryTransfer.create.mockResolvedValue({ id: 'trf1' });

      await service.transfer(
        transferParams.variantId,
        transferParams.fromWarehouseId,
        transferParams.toWarehouseId,
        transferParams.quantity,
      );

      // Verify source deduction
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: { quantity: 40 },
      });

      // Verify destination addition
      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'inv2' },
        data: { quantity: 30 },
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
      await expect(service.transfer('v1', 'w1', 'w1', 10))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if source stock is insufficient', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValueOnce([
        { id: 'inv1', quantity: 5, reservedQuantity: 0 },
      ]);

      await expect(service.transfer('v1', 'w1', 'w2', 10))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if internal record not found', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValueOnce([]); // from not found

      await expect(service.transfer('v1', 'w1', 'w2', 10))
        .rejects.toThrow(NotFoundException);
    });
  });
});
