import { SystemContextStore } from '@common/context/system-context.store';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ActionType, Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { lockInventoryItem } from './inventory-lock.helper';

/**
 * Allocation item details.
 */
export interface AllocationItem {
  variantId: string;
  warehouseId: string;
  quantity: number;
  cartItemId?: string; // Atomic link to source CartItem
}

/**
 * Inventory service.
 * Handles stock checks, reservations, adjustments, and movements.
 */
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks the availability of a variant in the specified warehouse or globally.
   */
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
      (sum, item) =>
        sum + (item.quantity || 0) - (item.reservedQuantity || 0) - (item.damagedQuantity || 0),
      0,
    );

    return {
      available: totalAvailable >= quantity,
      totalAvailable,
    };
  }

  /**
   * Reserves stock for an order using row-level locking.
   */
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
          const inventoryItem = await lockInventoryItem(tx, {
            variantId: alloc.variantId,
            warehouseId: alloc.warehouseId,
            logger: this.logger,
            context: 'InventoryReserve',
          });

          const available = inventoryItem.quantity - inventoryItem.reservedQuantity;

          if (available < alloc.quantity) {
            throw new ConflictException({
              code: 'STOCK_INSUFFICIENT',
              message:
                `Insufficient stock: available=${available}, requested=${alloc.quantity} ` +
                `(variant=${alloc.variantId}, warehouse=${alloc.warehouseId})`,
            });
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
              cartItemId: alloc.cartItemId,
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

  /**
   * Deducts the reserved stock for a confirmed order.
   */
  async deduct(orderId: string, txClient?: Prisma.TransactionClient): Promise<void> {
    return SystemContextStore.asInternal('InventoryService', async () => {
      const execute = async (tx: Prisma.TransactionClient) => {
        const reservations = await tx.inventoryReservation.findMany({
          where: { orderId, status: ReservationStatus.active },
        });

        for (const res of reservations) {
          const inventoryItem = await lockInventoryItem(tx, {
            variantId: res.variantId,
            warehouseId: res.warehouseId,
            logger: this.logger,
            context: 'InventoryDeduct',
          });

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

  /**
   * Releases and restores reserved stock.
   */
  async release(orderId: string, txClient?: Prisma.TransactionClient): Promise<void> {
    return SystemContextStore.asInternal('InventoryService', async () => {
      const execute = async (tx: Prisma.TransactionClient) => {
        const reservations = await tx.inventoryReservation.findMany({
          where: { orderId, status: ReservationStatus.active },
        });

        for (const res of reservations) {
          const inventoryItem = await lockInventoryItem(tx, {
            variantId: res.variantId,
            warehouseId: res.warehouseId,
            logger: this.logger,
            context: 'InventoryRelease',
          });

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

  /**
   * Imports or increases stock levels in a specific warehouse.
   */
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

        const beforeQuantity =
          inventoryItem.quantity - (inventoryItem.quantity === quantity ? 0 : quantity);

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

  /**
   * Adjusts stock quantity for a variant in a warehouse.
   */
  async adjustStock(variantId: string, warehouseId: string, newQuantity: number, reason?: string) {
    return SystemContextStore.asInternal('InventoryService', async () => {
      return this.prisma.$transaction(async (tx) => {
        const inventoryItem = await lockInventoryItem(tx, {
          variantId,
          warehouseId,
          logger: this.logger,
          context: 'InventoryAdjust',
          notFoundMessage:
            `Inventory item not found for variant=${variantId} in warehouse=${warehouseId}`,
        });

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

  /**
   * Moves a specified quantity of a variant in a warehouse to the damaged pool.
   */
  async reportDamage(
    variantId: string,
    warehouseId: string,
    quantity: number,
    actorId?: string,
    reason?: string,
  ) {
    return SystemContextStore.asInternal('InventoryService', async () => {
      return this.prisma.$transaction(async (tx) => {
        const inventoryItem = await lockInventoryItem(tx, {
          variantId,
          warehouseId,
          logger: this.logger,
          context: 'InventoryDamage',
          notFoundMessage: 'Inventory item not found',
        });

        if (!inventoryItem || inventoryItem.quantity < quantity) {
          throw new BadRequestException('Insufficient stock to report damage');
        }

        const beforeQuantity = inventoryItem.quantity;

        const updated = await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            quantity: { decrement: quantity },
            damagedQuantity: { increment: quantity },
          },
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
            note: reason || 'Damage reported (Moved to damaged pool)',
          },
        });

        return updated;
      });
    });
  }

  /**
   * Retrieves all stock levels matching optional filters.
   */
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

  /**
   * Retrieves stock levels for a specific variant across warehouses.
   */
  async getStockLevels(variantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { productVariantId: variantId },
      include: { warehouse: true },
    });
  }
}
