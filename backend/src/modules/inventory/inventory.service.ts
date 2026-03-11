import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

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
 * Core stock operations with transaction + row-level locking (FOR UPDATE).
 * Prevents overselling under concurrent requests.
 */
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CHECK AVAILABILITY
  // ============================================

  /**
   * Check stock availability for a variant.
   * If warehouseId provided, check single warehouse.
   * Otherwise, aggregate across all warehouses.
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
      (sum, item) => sum + item.quantity - item.reservedQuantity,
      0,
    );

    return {
      available: totalAvailable >= quantity,
      totalAvailable,
    };
  }

  async getStockLevels(variantId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { productVariantId: variantId },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    return items.map((item) => ({
      warehouseId: item.warehouseId,
      warehouseName: item.warehouse.name,
      warehouseCode: item.warehouse.code,
      quantity: item.quantity,
      reserved: item.reservedQuantity,
      available: item.quantity - item.reservedQuantity,
    }));
  }

  /**
   * Get all inventory items with optional filters.
   */
  async getAllStockLevels(filters: { warehouseId?: string; variantId?: string }) {
    const where: Prisma.InventoryItemWhereInput = {
      ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
      ...(filters.variantId && { productVariantId: filters.variantId }),
    };

    return this.prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        productVariant: { select: { id: true, sku: true, variantTitle: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ============================================
  // RESERVE — Row-level lock (FOR UPDATE)
  // ============================================

  /**
   * Reserve stock for an order.
   * Uses SELECT ... FOR UPDATE to prevent race conditions.
   *
   * @param orderId - The order requesting reservation
   * @param allocations - Pre-computed allocations from InventoryAllocatorService
   * @param expiresAt - When the reservation expires
   */
  async reserve(
    orderId: string,
    allocations: AllocationItem[],
    expiresAt: Date,
    txClient?: Prisma.TransactionClient,
  ): Promise<string[]> {
    const execute = async (tx: Prisma.TransactionClient) => {
      const reservationIds: string[] = [];

      for (const alloc of allocations) {
        // Row-level lock: SELECT ... FOR UPDATE
        const [inventoryItem] = await tx.$queryRawUnsafe<
          Array<{ id: string; quantity: number; reservedQuantity: number }>
        >(
          `SELECT id, quantity, "reservedQuantity"
           FROM "InventoryItem"
           WHERE "productVariantId" = $1 AND "warehouseId" = $2
           FOR UPDATE`,
          alloc.variantId,
          alloc.warehouseId,
        );

        if (!inventoryItem) {
          throw new NotFoundException(
            `No inventory found for variant=${alloc.variantId} warehouse=${alloc.warehouseId}`,
          );
        }

        const available =
          inventoryItem.quantity - inventoryItem.reservedQuantity;

        if (available < alloc.quantity) {
          throw new ConflictException(
            `Insufficient stock: available=${available}, requested=${alloc.quantity} ` +
              `(variant=${alloc.variantId}, warehouse=${alloc.warehouseId})`,
          );
        }

        // Increment reservedQuantity
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            reservedQuantity: { increment: alloc.quantity },
          },
        });

        // Create reservation record
        const reservation = await tx.inventoryReservation.create({
          data: {
            orderId,
            variantId: alloc.variantId,
            warehouseId: alloc.warehouseId,
            quantity: alloc.quantity,
            expiresAt,
            status: 'active',
          },
        });

        reservationIds.push(reservation.id);

        // Log the reservation
        await tx.inventoryLog.create({
          data: {
            inventoryItemId: inventoryItem.id,
            productVariantId: alloc.variantId,
            warehouseId: alloc.warehouseId,
            actionType: 'SALE',
            quantityChange: 0, // no actual quantity change yet, just reserved
            beforeQuantity: inventoryItem.quantity,
            afterQuantity: inventoryItem.quantity,
            referenceType: 'ORDER',
            referenceId: orderId,
            note: `Reserved ${alloc.quantity} units for order`,
          },
        });
      }

      return reservationIds;
    };

    return txClient ? execute(txClient) : this.prisma.$transaction(execute);
  }

  // ============================================
  // DEDUCT — After successful payment
  // ============================================

  /**
   * Deduct stock after payment confirmation.
   * Decreases both quantity and reservedQuantity.
   * Uses row-level lock.
   */
  async deduct(orderId: string, txClient?: Prisma.TransactionClient): Promise<void> {
    const execute = async (tx: Prisma.TransactionClient) => {
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId, status: 'active' },
      });

      if (reservations.length === 0) {
        this.logger.warn(`No active reservations found for order ${orderId}`);
        return;
      }

      for (const reservation of reservations) {
        // Row-level lock
        const [inventoryItem] = await tx.$queryRawUnsafe<
          Array<{ id: string; quantity: number; reservedQuantity: number }>
        >(
          `SELECT id, quantity, "reservedQuantity"
           FROM "InventoryItem"
           WHERE "productVariantId" = $1 AND "warehouseId" = $2
           FOR UPDATE`,
          reservation.variantId,
          reservation.warehouseId,
        );

        if (!inventoryItem) {
          throw new NotFoundException(
            `Inventory item not found for deduction: variant=${reservation.variantId}`,
          );
        }

        const newQuantity = inventoryItem.quantity - reservation.quantity;
        const newReserved =
          inventoryItem.reservedQuantity - reservation.quantity;

        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            quantity: newQuantity,
            reservedQuantity: Math.max(0, newReserved),
          },
        });

        // Update reservation status
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: 'confirmed' },
        });

        // Log
        await tx.inventoryLog.create({
          data: {
            inventoryItemId: inventoryItem.id,
            productVariantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
            actionType: 'SALE',
            quantityChange: -reservation.quantity,
            beforeQuantity: inventoryItem.quantity,
            afterQuantity: newQuantity,
            referenceType: 'ORDER',
            referenceId: orderId,
            note: `Deducted ${reservation.quantity} units after payment`,
          },
        });
      }
    };

    if (txClient) {
      await execute(txClient);
    } else {
      await this.prisma.$transaction(execute);
    }

    this.logger.log(`Inventory deducted for order ${orderId}`);
  }

  // ============================================
  // RELEASE — Order cancelled / payment expired
  // ============================================

  /**
   * Release reserved stock when order is cancelled.
   * Uses row-level lock.
   */
  async release(orderId: string, txClient?: Prisma.TransactionClient): Promise<void> {
    const execute = async (tx: Prisma.TransactionClient) => {
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId, status: 'active' },
      });

      if (reservations.length === 0) {
        this.logger.warn(`No active reservations to release for order ${orderId}`);
        return;
      }

      for (const reservation of reservations) {
        // Row-level lock
        const [inventoryItem] = await tx.$queryRawUnsafe<
          Array<{ id: string; quantity: number; reservedQuantity: number }>
        >(
          `SELECT id, quantity, "reservedQuantity"
           FROM "InventoryItem"
           WHERE "productVariantId" = $1 AND "warehouseId" = $2
           FOR UPDATE`,
          reservation.variantId,
          reservation.warehouseId,
        );

        if (!inventoryItem) {
          this.logger.error(
            `Inventory item not found for release: variant=${reservation.variantId}`,
          );
          continue;
        }

        const newReserved =
          inventoryItem.reservedQuantity - reservation.quantity;

        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            reservedQuantity: Math.max(0, newReserved),
          },
        });

        // Update reservation status
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: 'released' },
        });

        // Log
        await tx.inventoryLog.create({
          data: {
            inventoryItemId: inventoryItem.id,
            productVariantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
            actionType: 'RETURN',
            quantityChange: 0,
            beforeQuantity: inventoryItem.quantity,
            afterQuantity: inventoryItem.quantity,
            referenceType: 'ORDER',
            referenceId: orderId,
            note: `Released ${reservation.quantity} reserved units`,
          },
        });
      }
    };

    if (txClient) {
      await execute(txClient);
    } else {
      await this.prisma.$transaction(execute);
    }

    this.logger.log(`Inventory released for order ${orderId}`);
  }

  // ============================================
  // RECEIVE STOCK — Import goods
  // ============================================

  /**
   * Receive stock into a warehouse (e.g., goods arrival).
   * Creates InventoryItem if it doesn't exist.
   */
  async receiveStock(
    variantId: string,
    warehouseId: string,
    quantity: number,
    actorId?: string,
    note?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Upsert inventory item
      let inventoryItem = await tx.inventoryItem.findUnique({
        where: {
          productVariantId_warehouseId: {
            productVariantId: variantId,
            warehouseId,
          },
        },
      });

      if (!inventoryItem) {
        inventoryItem = await tx.inventoryItem.create({
          data: {
            productVariantId: variantId,
            warehouseId,
            quantity: 0,
            reservedQuantity: 0,
          },
        });
      }

      const beforeQuantity = inventoryItem.quantity;
      const afterQuantity = beforeQuantity + quantity;

      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantity: afterQuantity },
      });

      await tx.inventoryLog.create({
        data: {
          inventoryItemId: inventoryItem.id,
          productVariantId: variantId,
          warehouseId,
          actionType: 'IMPORT',
          quantityChange: quantity,
          beforeQuantity,
          afterQuantity,
          referenceType: 'ADJUSTMENT',
          actorId,
          note: note || `Received ${quantity} units`,
        },
      });
    });

    this.logger.log(
      `Received ${quantity} units: variant=${variantId} warehouse=${warehouseId}`,
    );
  }

  // ============================================
  // ADJUST STOCK — Manual correction
  // ============================================

  /**
   * Manual stock adjustment (e.g., after physical count).
   */
  async adjustStock(
    variantId: string,
    warehouseId: string,
    newQuantity: number,
    reason: string,
    actorId?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: {
          productVariantId_warehouseId: {
            productVariantId: variantId,
            warehouseId,
          },
        },
      });

      if (!inventoryItem) {
        throw new NotFoundException(
          `No inventory found for variant=${variantId} warehouse=${warehouseId}`,
        );
      }

      const beforeQuantity = inventoryItem.quantity;
      const quantityChange = newQuantity - beforeQuantity;

      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantity: newQuantity },
      });

      await tx.inventoryLog.create({
        data: {
          inventoryItemId: inventoryItem.id,
          productVariantId: variantId,
          warehouseId,
          actionType: 'ADJUSTMENT',
          quantityChange,
          beforeQuantity,
          afterQuantity: newQuantity,
          referenceType: 'ADJUSTMENT',
          actorId,
          note: reason,
        },
      });
    });

    this.logger.log(
      `Adjusted stock to ${newQuantity}: variant=${variantId} warehouse=${warehouseId}`,
    );
  }

  // ============================================
  // DIRECT DEDUCT (COD) — No prior reservation
  // ============================================

  /**
   * Directly deduct stock without prior reservation (for COD orders).
   * Uses row-level lock.
   */
  async directDeduct(
    orderId: string,
    allocations: AllocationItem[],
    txClient?: Prisma.TransactionClient,
  ): Promise<void> {
    const execute = async (tx: Prisma.TransactionClient) => {
      for (const alloc of allocations) {
        // Row-level lock
        const [inventoryItem] = await tx.$queryRawUnsafe<
          Array<{ id: string; quantity: number; reservedQuantity: number }>
        >(
          `SELECT id, quantity, "reservedQuantity"
           FROM "InventoryItem"
           WHERE "productVariantId" = $1 AND "warehouseId" = $2
           FOR UPDATE`,
          alloc.variantId,
          alloc.warehouseId,
        );

        if (!inventoryItem) {
          throw new NotFoundException(
            `No inventory found for variant=${alloc.variantId} warehouse=${alloc.warehouseId}`,
          );
        }

        const available =
          inventoryItem.quantity - inventoryItem.reservedQuantity;

        if (available < alloc.quantity) {
          throw new ConflictException(
            `Insufficient stock for COD deduction: available=${available}, requested=${alloc.quantity}`,
          );
        }

        const newQuantity = inventoryItem.quantity - alloc.quantity;

        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantity: newQuantity },
        });

        // Log
        await tx.inventoryLog.create({
          data: {
            inventoryItemId: inventoryItem.id,
            productVariantId: alloc.variantId,
            warehouseId: alloc.warehouseId,
            actionType: 'SALE',
            quantityChange: -alloc.quantity,
            beforeQuantity: inventoryItem.quantity,
            afterQuantity: newQuantity,
            referenceType: 'ORDER',
            referenceId: orderId,
            note: `COD order: deducted ${alloc.quantity} units`,
          },
        });
      }
    };

    if (txClient) {
      await execute(txClient);
    } else {
      await this.prisma.$transaction(execute);
    }

    this.logger.log(`Direct deduction for COD order ${orderId}`);
  }

  // ============================================
  // REPORT DAMAGE — Mark stock as damaged
  // ============================================

  /**
   * Report damaged stock.
   * Decreases quantity and logs with ActionType.DAMAGE.
   */
  async reportDamage(
    variantId: string,
    warehouseId: string,
    quantity: number,
    actorId?: string,
    note?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const inventoryItem = await tx.inventoryItem.findUnique({
        where: {
          productVariantId_warehouseId: {
            productVariantId: variantId,
            warehouseId,
          },
        },
      });

      if (!inventoryItem) {
        throw new NotFoundException(
          `No inventory found for variant=${variantId} warehouse=${warehouseId}`,
        );
      }

      const beforeQuantity = inventoryItem.quantity;
      const afterQuantity = beforeQuantity - quantity;

      if (afterQuantity < 0) {
        throw new BadRequestException(
          `Cannot report damage for more than available stock: ` +
            `available=${beforeQuantity}, requested=${quantity}`,
        );
      }

      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantity: afterQuantity },
      });

      await tx.inventoryLog.create({
        data: {
          inventoryItemId: inventoryItem.id,
          productVariantId: variantId,
          warehouseId,
          actionType: 'DAMAGE',
          quantityChange: -quantity,
          beforeQuantity,
          afterQuantity,
          referenceType: 'DAMAGE',
          actorId,
          note: note || `Reported ${quantity} units as damaged`,
        },
      });
    });

    this.logger.log(
      `Reported ${quantity} damaged units: variant=${variantId} warehouse=${warehouseId}`,
    );
  }
}
