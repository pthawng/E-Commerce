import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockQueryDto } from './dto';
import { lockInventoryItem } from './inventory-lock.helper';

/**
 * Stock movement service.
 * Handles stock transfers between warehouses and queries movement history.
 */
@Injectable()
export class StockMovementService {
  private readonly logger = new Logger(StockMovementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Performs an atomic stock transfer.
   */
  async transfer(
    variantId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    actorId?: string,
    note?: string,
  ): Promise<void> {
    const transfer = await this.createTransfer(
      variantId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      actorId,
      note,
    );
    await this.shipTransfer(transfer.id, actorId);
    await this.receiveTransfer(transfer.id, actorId);
  }

  /**
   * Creates a new pending stock transfer record.
   */
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

  /**
   * Ships stock out of the source warehouse.
   */
  async shipTransfer(transferId: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: { fromWarehouse: true, toWarehouse: true },
      });

      if (!transfer || transfer.status !== 'PENDING') {
        throw new BadRequestException('Transfer not found or not in PENDING status');
      }

      const fromItem = await lockInventoryItem(tx, {
        variantId: transfer.variantId,
        warehouseId: transfer.fromWarehouseId,
        logger: this.logger,
        context: 'InventoryTransferShip',
        notFoundMessage: 'Inventory item not found in source warehouse',
      });

      if (
        fromItem.quantity - fromItem.reservedQuantity - fromItem.damagedQuantity <
        transfer.quantity
      ) {
        throw new BadRequestException('Insufficient available stock in source warehouse');
      }

      await tx.inventoryItem.update({
        where: { id: fromItem.id },
        data: { quantity: { decrement: transfer.quantity } },
      });

      await tx.inventoryItem.upsert({
        where: {
          productVariantId_warehouseId: {
            productVariantId: transfer.variantId,
            warehouseId: transfer.toWarehouseId,
          },
        },
        create: {
          productVariantId: transfer.variantId,
          warehouseId: transfer.toWarehouseId,
          quantity: 0,
          inTransitQuantity: transfer.quantity,
        },
        update: { inTransitQuantity: { increment: transfer.quantity } },
      });

      const updated = await tx.inventoryTransfer.update({
        where: { id: transferId },
        data: { status: 'SHIPPED', actorId },
      });

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

  /**
   * Receives shipped stock into the destination warehouse.
   */
  async receiveTransfer(transferId: string, actorId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: { toWarehouse: true },
      });

      if (!transfer || transfer.status !== 'SHIPPED') {
        throw new BadRequestException('Transfer not found or not in SHIPPED status');
      }

      const toItem = await lockInventoryItem(tx, {
        variantId: transfer.variantId,
        warehouseId: transfer.toWarehouseId,
        logger: this.logger,
        context: 'InventoryTransferReceive',
        notFoundMessage: 'Inventory item not found in destination warehouse',
      });

      if (!toItem || toItem.inTransitQuantity < transfer.quantity) {
        throw new BadRequestException('In-transit quantity mismatch in destination');
      }

      await tx.inventoryItem.update({
        where: { id: toItem.id },
        data: {
          inTransitQuantity: { decrement: transfer.quantity },
          quantity: { increment: transfer.quantity },
        },
      });

      const updated = await tx.inventoryTransfer.update({
        where: { id: transferId },
        data: { status: 'COMPLETED', actorId },
      });

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

  /**
   * Queries inventory movement history with filters and pagination.
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

  /**
   * Retrieves all inventory transfers.
   */
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
