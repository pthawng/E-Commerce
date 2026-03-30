import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, ActionType, ReservationStatus } from '@prisma/client';
import { SystemContextStore } from '@common/context/system-context.store';
import { withRetry } from '@common/utils/retry.util';

/**
 * Allocation item — result from InventoryAllocatorService
 */
export interface AllocationItem {
  variantId: string;
  warehouseId: string;
  quantity: number;
}

/**
 * InventoryService
 *
 * Core stock operations with transaction + row-level locking (FOR UPDATE NOWAIT).
 * Enforces system invariants via SystemContextStore.
 */
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CHECK AVAILABILITY
  // ============================================

  async checkAvailability(
    variantId: string,
    quantity: number,
    warehouseId?: string,
  ): Promise<{ available: boolean; totalAvailable: number }> {
    const where: Prisma.InventoryItemWhereInput = {
      productVariantId: variantId,
      ...(warehouseId && { warehouseId }),
    };

    const items = await this.prisma.inventoryItem.findMany({ where });

    const totalAvailable = items.reduce(
      (sum, item) => sum + item.quantity - item.reservedQuantity,
      0,
    );

    return {
      available: totalAvailable >= quantity,
      totalAvailable,
    };
  }

  // ============================================
  // RESERVE — Row-level lock (FOR UPDATE NOWAIT)
  // ============================================

  async reserve(
    orderId: string,
    allocations: AllocationItem[],
    expiresAt: Date,
    txClient?: Prisma.TransactionClient,
    userId?: string,
    sessionId?: string,
  ): Promise<string[]> {
    return SystemContextStore.asInternal('InventoryService', async () => {
      const execute = async (tx: Prisma.TransactionClient) => {
        const reservationIds: string[] = [];

        for (const alloc of allocations) {
          // Use NOWAIT + Retry for maximum concurrency safety without hanging
          const inventoryItem = await withRetry(async () => {
            const [item] = await tx.$queryRawUnsafe<
              Array<{ id: string; quantity: number; reservedQuantity: number }>
            >(
              `SELECT id, quantity, "reservedQuantity"
               FROM "InventoryItem"
               WHERE "productVariantId" = $1 AND "warehouseId" = $2
               FOR UPDATE NOWAIT`,
              alloc.variantId,
              alloc.warehouseId,
            );
            return item;
          }, { logger: this.logger, context: 'InventoryReserve' });

          if (!inventoryItem) {
            throw new NotFoundException(
              `No inventory found for variant=${alloc.variantId} warehouse=${alloc.warehouseId}`,
            );
          }

          const available = inventoryItem.quantity - inventoryItem.reservedQuantity;

          if (available < alloc.quantity) {
            throw new ConflictException(
              `Insufficient stock: available=${available}, requested=${alloc.quantity} ` +
                `(variant=${alloc.variantId}, warehouse=${alloc.warehouseId})`,
            );
          }

          const beforeQuantity = inventoryItem.quantity;
          
          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              reservedQuantity: { increment: alloc.quantity },
            },
          });

          const reservation = await tx.inventoryReservation.create({
            data: {
              orderId,
              variantId: alloc.variantId,
              warehouseId: alloc.warehouseId,
              quantity: alloc.quantity,
              expiresAt,
              status: ReservationStatus.active,
              userId,
              sessionId,
            },
          });

          reservationIds.push(reservation.id);

          await tx.inventoryLog.create({
            data: {
              inventoryItemId: inventoryItem.id,
              productVariantId: alloc.variantId,
              warehouseId: alloc.warehouseId,
              actionType: ActionType.SALE,
              quantityChange: 0,
              beforeQuantity,
              afterQuantity: beforeQuantity,
              referenceId: orderId,
              referenceType: 'ORDER',
              note: `Reserved (State: ACTIVE) for order ${orderId}`,
            },
          });
        }

        return reservationIds;
      };

      return txClient ? execute(txClient) : this.prisma.$transaction(execute);
    });
  }

  // ============================================
  // CONFIRM — Atomic commit of reserved stock
  // ============================================

  async deduct(orderId: string, txClient?: Prisma.TransactionClient): Promise<void> {
    return SystemContextStore.asInternal('InventoryService', async () => {
      const execute = async (tx: Prisma.TransactionClient) => {
        const reservations = await tx.inventoryReservation.findMany({
          where: { orderId, status: ReservationStatus.active },
        });

        for (const res of reservations) {
          const inventoryItem = await withRetry(async () => {
            const [item] = await tx.$queryRawUnsafe<
              Array<{ id: string; quantity: number; reservedQuantity: number }>
            >(
              `SELECT id, quantity, "reservedQuantity"
               FROM "InventoryItem"
               WHERE "productVariantId" = $1 AND "warehouseId" = $2
               FOR UPDATE NOWAIT`,
              res.variantId,
              res.warehouseId,
            );
            return item;
          }, { logger: this.logger, context: 'InventoryDeduct' });

          if (!inventoryItem) continue;

          const beforeQuantity = inventoryItem.quantity;

          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              quantity: { decrement: res.quantity },
              reservedQuantity: { decrement: res.quantity },
            },
          });

          await tx.inventoryReservation.update({
            where: { id: res.id },
            data: { status: ReservationStatus.confirmed },
          });

          await tx.inventoryLog.create({
            data: {
              inventoryItemId: inventoryItem.id,
              productVariantId: res.variantId,
              warehouseId: res.warehouseId,
              actionType: ActionType.SALE,
              quantityChange: -res.quantity,
              beforeQuantity,
              afterQuantity: beforeQuantity - res.quantity,
              referenceId: orderId,
              referenceType: 'ORDER',
              note: `Confirmed (Deducted) for order ${orderId}`,
            },
          });
        }
      };

      return txClient ? execute(txClient) : this.prisma.$transaction(execute);
    });
  }

  // ============================================
  // RELEASE — Restore reserved stock
  // ============================================

  async release(orderId: string, txClient?: Prisma.TransactionClient): Promise<void> {
    return SystemContextStore.asInternal('InventoryService', async () => {
      const execute = async (tx: Prisma.TransactionClient) => {
        const reservations = await tx.inventoryReservation.findMany({
          where: { orderId, status: ReservationStatus.active },
        });

        for (const res of reservations) {
          const inventoryItem = await withRetry(async () => {
            const [item] = await tx.$queryRawUnsafe<
              Array<{ id: string; quantity: number; reservedQuantity: number }>
            >(
              `SELECT id, quantity, "reservedQuantity"
               FROM "InventoryItem"
               WHERE "productVariantId" = $1 AND "warehouseId" = $2
               FOR UPDATE NOWAIT`,
              res.variantId,
              res.warehouseId,
            );
            return item;
          }, { logger: this.logger, context: 'InventoryRelease' });

          if (!inventoryItem) continue;

          const beforeQuantity = inventoryItem.quantity;

          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              reservedQuantity: { decrement: res.quantity },
            },
          });

          await tx.inventoryReservation.update({
            where: { id: res.id },
            data: { status: ReservationStatus.released },
          });

          await tx.inventoryLog.create({
            data: {
              inventoryItemId: inventoryItem.id,
              productVariantId: res.variantId,
              warehouseId: res.warehouseId,
              actionType: ActionType.SALE,
              quantityChange: 0,
              beforeQuantity,
              afterQuantity: beforeQuantity,
              referenceId: orderId,
              referenceType: 'ORDER',
              note: `Released (Restored) from order ${orderId}`,
            },
          });
        }
      };

      return txClient ? execute(txClient) : this.prisma.$transaction(execute);
    });
  }

  // ============================================
  // STOCK MANAGEMENT (RESTORED)
  // ============================================

  async receiveStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
    actorId?: string,
    note?: string,
  ) {
    return SystemContextStore.asInternal('InventoryService', async () => {
      return this.prisma.$transaction(async (tx) => {
        const inventoryItem = await tx.inventoryItem.upsert({
          where: {
            productVariantId_warehouseId: { productVariantId: variantId, warehouseId },
          },
          create: {
            productVariantId: variantId,
            warehouseId,
            quantity,
          },
          update: {
            quantity: { increment: quantity },
          },
        });

        const beforeQuantity = inventoryItem.quantity - (inventoryItem.quantity === quantity ? 0 : quantity);

        await tx.inventoryLog.create({
          data: {
            inventoryItemId: inventoryItem.id,
            productVariantId: variantId,
            warehouseId,
            actionType: ActionType.IMPORT,
            quantityChange: quantity,
            beforeQuantity,
            afterQuantity: inventoryItem.quantity,
            actorId,
            note: note || 'Stock received',
          },
        });

        return inventoryItem;
      });
    });
  }

  async adjustStock(
    variantId: string,
    warehouseId: string,
    newQuantity: number,
    reason?: string,
  ) {
    return SystemContextStore.asInternal('InventoryService', async () => {
      return this.prisma.$transaction(async (tx) => {
        // Enforce row level lock for adjustment too
        const inventoryItem = await withRetry(async () => {
          const [item] = await tx.$queryRawUnsafe<any>(
            `SELECT id, quantity FROM "InventoryItem" WHERE "productVariantId" = $1 AND "warehouseId" = $2 FOR UPDATE NOWAIT`,
            variantId,
            warehouseId
          );
          return item;
        }, { logger: this.logger, context: 'InventoryAdjust' });

        if (!inventoryItem) {
          throw new NotFoundException(`Inventory item not found for variant=${variantId} in warehouse=${warehouseId}`);
        }

        const beforeQuantity = inventoryItem.quantity;

        const updated = await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantity: newQuantity },
        });

        await tx.inventoryLog.create({
          data: {
            inventoryItemId: inventoryItem.id,
            productVariantId: variantId,
            warehouseId,
            actionType: ActionType.ADJUSTMENT,
            quantityChange: newQuantity - beforeQuantity,
            beforeQuantity,
            afterQuantity: newQuantity,
            note: reason || 'Inventory adjustment',
          },
        });

        return updated;
      });
    });
  }

  async reportDamage(
    variantId: string,
    warehouseId: string,
    quantity: number,
    actorId?: string,
    reason?: string,
  ) {
    return SystemContextStore.asInternal('InventoryService', async () => {
      return this.prisma.$transaction(async (tx) => {
        // Enforce row level lock
        const inventoryItem = await withRetry(async () => {
          const [item] = await tx.$queryRawUnsafe<any>(
            `SELECT id, quantity FROM "InventoryItem" WHERE "productVariantId" = $1 AND "warehouseId" = $2 FOR UPDATE NOWAIT`,
            variantId,
            warehouseId
          );
          return item;
        }, { logger: this.logger, context: 'InventoryDamage' });

        if (!inventoryItem || inventoryItem.quantity < quantity) {
          throw new BadRequestException('Insufficient stock to report damage');
        }

        const beforeQuantity = inventoryItem.quantity;

        const updated = await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantity: { decrement: quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            inventoryItemId: inventoryItem.id,
            productVariantId: variantId,
            warehouseId,
            actionType: ActionType.DAMAGE,
            quantityChange: -quantity,
            beforeQuantity,
            afterQuantity: beforeQuantity - quantity,
            actorId,
            note: reason || 'Damage report',
          },
        });

        return updated;
      });
    });
  }

  // ============================================
  // READ OPS (No Guard Required)
  // ============================================

  async getAllStockLevels(filters: { warehouseId?: string; variantId?: string }) {
    return this.prisma.inventoryItem.findMany({
      where: {
        ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
        ...(filters.variantId && { productVariantId: filters.variantId }),
      },
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }

  async getStockLevels(variantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { productVariantId: variantId },
      include: { warehouse: true },
    });
  }
}
