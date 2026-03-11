import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
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
   * Transfer stock between two warehouses.
   * Both deduction and addition happen in a single transaction
   * with row-level locking to prevent data corruption.
   */
  async transfer(
    variantId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    actorId?: string,
    note?: string,
  ): Promise<void> {
    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('Cannot transfer to the same warehouse');
    }

    await this.prisma.$transaction(async (tx) => {
      // Row-level lock on source warehouse
      const [fromItem] = await tx.$queryRawUnsafe<
        Array<{ id: string; quantity: number; reservedQuantity: number }>
      >(
        `SELECT id, quantity, "reservedQuantity"
         FROM "InventoryItem"
         WHERE "productVariantId" = $1 AND "warehouseId" = $2
         FOR UPDATE`,
        variantId,
        fromWarehouseId,
      );

      if (!fromItem) {
        throw new NotFoundException(
          `No inventory found in source warehouse for variant=${variantId}`,
        );
      }

      const availableInSource = fromItem.quantity - fromItem.reservedQuantity;
      if (availableInSource < quantity) {
        throw new BadRequestException(
          `Insufficient available stock in source warehouse: ` +
            `available=${availableInSource}, requested=${quantity}`,
        );
      }

      // Row-level lock on destination warehouse (upsert if doesn't exist)
      let toItem: { id: string; quantity: number; reservedQuantity: number } | null = null;

      const [existingToItem] = await tx.$queryRawUnsafe<
        Array<{ id: string; quantity: number; reservedQuantity: number }>
      >(
        `SELECT id, quantity, "reservedQuantity"
         FROM "InventoryItem"
         WHERE "productVariantId" = $1 AND "warehouseId" = $2
         FOR UPDATE`,
        variantId,
        toWarehouseId,
      );

      if (existingToItem) {
        toItem = existingToItem;
      } else {
        // Create inventory item in destination warehouse
        const created = await tx.inventoryItem.create({
          data: {
            productVariantId: variantId,
            warehouseId: toWarehouseId,
            quantity: 0,
            reservedQuantity: 0,
          },
        });
        toItem = { id: created.id, quantity: 0, reservedQuantity: 0 };
      }

      // Deduct from source
      const fromBefore = fromItem.quantity;
      const fromAfter = fromBefore - quantity;

      await tx.inventoryItem.update({
        where: { id: fromItem.id },
        data: { quantity: fromAfter },
      });

      // Add to destination
      const toBefore = toItem.quantity;
      const toAfter = toBefore + quantity;

      await tx.inventoryItem.update({
        where: { id: toItem.id },
        data: { quantity: toAfter },
      });

      // Create InventoryTransfer record
      const transfer = await tx.inventoryTransfer.create({
        data: {
          variantId,
          fromWarehouseId,
          toWarehouseId,
          quantity,
          status: 'completed',
          actorId,
          note,
        },
      });

      const transferRefId = transfer.id;

      // Log TRANSFER_OUT
      await tx.inventoryLog.create({
        data: {
          inventoryItemId: fromItem.id,
          productVariantId: variantId,
          warehouseId: fromWarehouseId,
          actionType: 'TRANSFER_OUT',
          quantityChange: -quantity,
          beforeQuantity: fromBefore,
          afterQuantity: fromAfter,
          referenceType: 'TRANSFER',
          referenceId: transferRefId,
          actorId,
          note: note || `Transfer out ${quantity} units to warehouse ${toWarehouseId}`,
        },
      });

      // Log TRANSFER_IN
      await tx.inventoryLog.create({
        data: {
          inventoryItemId: toItem.id,
          productVariantId: variantId,
          warehouseId: toWarehouseId,
          actionType: 'TRANSFER_IN',
          quantityChange: quantity,
          beforeQuantity: toBefore,
          afterQuantity: toAfter,
          referenceType: 'TRANSFER',
          referenceId: transferRefId,
          actorId,
          note: note || `Transfer in ${quantity} units from warehouse ${fromWarehouseId}`,
        },
      });
    });

    this.logger.log(
      `Transferred ${quantity} units: variant=${variantId} ${fromWarehouseId} → ${toWarehouseId}`,
    );
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
}
