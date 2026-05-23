import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockQueryDto } from './dto';

/**
 * StockMovementService
 *
 * Handles stock transfers between warehouses and movement history queries.
 * All transfer operations use transactions + row-level locking.
 */
@Injectable()
export class StockMovementService {
  private readonly logger = new Logger(StockMovementService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // TRANSFER STOCK — Atomic transaction
  // ============================================

  /**
   * Quick Transfer (Atomic)
   * Deprecated in favor of lifecycle-based transfers but kept for backward compatibility.
   */
  async transfer(
    variantId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    actorId?: string,
    note?: string,
  ): Promise<void> {
    const transfer = await this.createTransfer(variantId, fromWarehouseId, toWarehouseId, quantity, actorId, note);
    await this.shipTransfer(transfer.id, actorId);
    await this.receiveTransfer(transfer.id, actorId);
  }

  async createTransfer(
    variantId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    actorId?: string,
    note?: string,
  ) {
    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('Cannot transfer to the same warehouse');
    }

    return this.prisma.inventoryTransfer.create({
      data: {
        variantId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        status: 'PENDING',
        actorId,
        note,
      },
    });
  }

  async shipTransfer(transferId: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: { fromWarehouse: true, toWarehouse: true }
      });

      if (!transfer || transfer.status !== 'PENDING') {
        throw new BadRequestException('Transfer not found or not in PENDING status');
      }

      // Lock source inventory
      const [fromItem] = await tx.$queryRawUnsafe<any>(
        `SELECT id, quantity, "reservedQuantity", "damagedQuantity" FROM "InventoryItem" WHERE "productVariantId" = $1 AND "warehouseId" = $2 FOR UPDATE`,
        transfer.variantId,
        transfer.fromWarehouseId,
      );

      if (!fromItem) {
        throw new NotFoundException('Inventory item not found in source warehouse');
      }

      if ((fromItem.quantity - fromItem.reservedQuantity - fromItem.damagedQuantity) < transfer.quantity) {
        throw new BadRequestException('Insufficient available stock in source warehouse');
      }

      // 1. Deduct from source on-hand
      await tx.inventoryItem.update({
        where: { id: fromItem.id },
        data: { quantity: { decrement: transfer.quantity } },
      });

      // 2. Increment destination in-transit
      await tx.inventoryItem.upsert({
        where: { productVariantId_warehouseId: { productVariantId: transfer.variantId, warehouseId: transfer.toWarehouseId } },
        create: {
          productVariantId: transfer.variantId,
          warehouseId: transfer.toWarehouseId,
          quantity: 0,
          inTransitQuantity: transfer.quantity,
        },
        update: { inTransitQuantity: { increment: transfer.quantity } },
      });

      // 3. Update transfer status
      const updated = await tx.inventoryTransfer.update({
        where: { id: transferId },
        data: { status: 'SHIPPED', actorId },
      });

      // Log movement
      await tx.inventoryLog.create({
        data: {
          inventoryItemId: fromItem.id,
          productVariantId: transfer.variantId,
          warehouseId: transfer.fromWarehouseId,
          actionType: 'TRANSFER_OUT',
          quantityChange: -transfer.quantity,
          beforeQuantity: fromItem.quantity,
          afterQuantity: fromItem.quantity - transfer.quantity,
          referenceType: 'TRANSFER',
          referenceId: transferId,
          actorId,
          note: `Shipped to ${transfer.toWarehouse.name}`,
        },
      });

      return updated;
    });
  }

  async receiveTransfer(transferId: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: { toWarehouse: true }
      });

      if (!transfer || transfer.status !== 'SHIPPED') {
        throw new BadRequestException('Transfer not found or not in SHIPPED status');
      }

      // Lock destination inventory
      const [toItem] = await tx.$queryRawUnsafe<any>(
        `SELECT id, quantity, "inTransitQuantity" FROM "InventoryItem" WHERE "productVariantId" = $1 AND "warehouseId" = $2 FOR UPDATE`,
        transfer.variantId,
        transfer.toWarehouseId,
      );

      if (!toItem || toItem.inTransitQuantity < transfer.quantity) {
        throw new BadRequestException('In-transit quantity mismatch in destination');
      }

      // 1. Move from in-transit to on-hand
      await tx.inventoryItem.update({
        where: { id: toItem.id },
        data: { 
          inTransitQuantity: { decrement: transfer.quantity },
          quantity: { increment: transfer.quantity }
        },
      });

      // 2. Update transfer status
      const updated = await tx.inventoryTransfer.update({
        where: { id: transferId },
        data: { status: 'COMPLETED', actorId },
      });

      // Log movement
      await tx.inventoryLog.create({
        data: {
          inventoryItemId: toItem.id,
          productVariantId: transfer.variantId,
          warehouseId: transfer.toWarehouseId,
          actionType: 'TRANSFER_IN',
          quantityChange: transfer.quantity,
          beforeQuantity: toItem.quantity,
          afterQuantity: toItem.quantity + transfer.quantity,
          referenceType: 'TRANSFER',
          referenceId: transferId,
          actorId,
          note: `Received at ${transfer.toWarehouse.name}`,
        },
      });

      return updated;
    });
  }

  // ============================================
  // MOVEMENT HISTORY
  // ============================================

  /**
   * Query inventory movement history with filters and pagination.
   */
  async getMovementHistory(queryDto: StockQueryDto) {
    const where: Prisma.InventoryLogWhereInput = {};

    if (queryDto.variantId) {
      where.productVariantId = queryDto.variantId;
    }
    if (queryDto.warehouseId) {
      where.warehouseId = queryDto.warehouseId;
    }
    if (queryDto.actionType) {
      where.actionType = queryDto.actionType as any;
    }
    if (queryDto.referenceType) {
      where.referenceType = queryDto.referenceType;
    }
    if (queryDto.fromDate || queryDto.toDate) {
      where.createdAt = {};
      if (queryDto.fromDate) {
        where.createdAt.gte = new Date(queryDto.fromDate);
      }
      if (queryDto.toDate) {
        where.createdAt.lte = new Date(queryDto.toDate);
      }
    }

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          productVariant: { select: { id: true, sku: true, variantTitle: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransfers() {
    return this.prisma.inventoryTransfer.findMany({
      include: {
        fromWarehouse: { select: { name: true } },
        toWarehouse: { select: { name: true } },
        productVariant: { select: { sku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
