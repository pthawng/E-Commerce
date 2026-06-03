import { SystemContextStore } from '@common/context/system-context.store';
import { SystemSettingService } from '@modules/system/system-setting.service';
import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { ActionType, Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { lockInventoryBalance } from './inventory-lock.helper';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SystemSettingService,
  ) {}

  /**
   * Checks the availability of a variant in the specified warehouse or globally.
   */
  async checkAvailability(
    variantId: string,
    quantity: number,
    warehouseId?: string,
  ): Promise<{ available: boolean; totalAvailable: number }> {
    const where: Prisma.InventoryBalanceWhereInput = {
      productVariantId: variantId,
      ...(warehouseId && { warehouseId }),
    };

    const items = await this.prisma.inventoryBalance.findMany({ where });

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
        const existingReservations = await tx.inventoryReservation.findMany({
          where: { orderId },
        });
        const idempotentReserveStatuses: readonly ReservationStatus[] = [
          ReservationStatus.active,
          ReservationStatus.confirmed,
        ];
        const terminalReserveStatuses: readonly ReservationStatus[] = [
          ReservationStatus.released,
          ReservationStatus.expired,
        ];
        const alreadyReserved = existingReservations.filter((reservation) =>
          idempotentReserveStatuses.includes(reservation.status),
        );

        if (alreadyReserved.length > 0) {
          return alreadyReserved.map((reservation) => reservation.id);
        }

        const terminalReservations = existingReservations.filter((reservation) =>
          terminalReserveStatuses.includes(reservation.status),
        );

        if (terminalReservations.length > 0) {
          throw new ConflictException({
            code: 'RESERVATION_TERMINAL',
            message: `Cannot reserve inventory again for terminal reservation order=${orderId}`,
          });
        }

        const reservationIds: string[] = [];

        for (const alloc of allocations) {
          const inventoryBalance = await lockInventoryBalance(tx, {
            variantId: alloc.variantId,
            warehouseId: alloc.warehouseId,
            logger: this.logger,
            context: 'InventoryReserve',
          });

          const available =
            inventoryBalance.quantity -
            inventoryBalance.reservedQuantity -
            inventoryBalance.damagedQuantity;

          if (available < alloc.quantity) {
            throw new ConflictException({
              code: 'STOCK_INSUFFICIENT',
              message:
                `Insufficient stock: available=${available}, requested=${alloc.quantity} ` +
                `(variant=${alloc.variantId}, warehouse=${alloc.warehouseId})`,
            });
          }

          const beforeQuantity = inventoryBalance.quantity;

          await tx.inventoryBalance.update({
            where: { id: inventoryBalance.id },
            data: {
              reservedQuantity: { increment: alloc.quantity },
            },
          });

          const reservation = await tx.inventoryReservation.create({
            data: {
              orderId,
              productVariantId: alloc.variantId,
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
              inventoryBalanceId: inventoryBalance.id,
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
        const reservations = await tx.inventoryReservation.findMany({ where: { orderId } });
        const activeReservations = reservations.filter(
          (reservation) => reservation.status === ReservationStatus.active,
        );

        if (activeReservations.length === 0) {
          if (
            reservations.some((reservation) => reservation.status === ReservationStatus.confirmed)
          ) {
            return;
          }

          const nonCommittableStatuses: readonly ReservationStatus[] = [
            ReservationStatus.released,
            ReservationStatus.expired,
          ];

          if (
            reservations.some((reservation) => nonCommittableStatuses.includes(reservation.status))
          ) {
            throw new ConflictException({
              code: 'RESERVATION_NOT_COMMITTABLE',
              message: `Cannot commit released or expired reservation for order=${orderId}`,
            });
          }

          return;
        }

        const now = new Date();

        if (activeReservations.some((reservation) => reservation.expiresAt < now)) {
          throw new ConflictException({
            code: 'RESERVATION_EXPIRED',
            message: `Cannot commit expired reservation for order=${orderId}`,
          });
        }

        for (const res of activeReservations) {
          const inventoryBalance = await lockInventoryBalance(tx, {
            variantId: res.productVariantId,
            warehouseId: res.warehouseId,
            logger: this.logger,
            context: 'InventoryDeduct',
          });

          const beforeQuantity = inventoryBalance.quantity;

          if (inventoryBalance.reservedQuantity < res.quantity) {
            throw new ConflictException({
              code: 'RESERVATION_INCONSISTENT',
              message: `Reserved quantity is lower than reservation quantity for order=${orderId}`,
            });
          }

          await tx.inventoryBalance.update({
            where: { id: inventoryBalance.id },
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
              inventoryBalanceId: inventoryBalance.id,
              productVariantId: res.productVariantId,
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
        const reservations = await tx.inventoryReservation.findMany({ where: { orderId } });
        const activeReservations = reservations.filter(
          (reservation) => reservation.status === ReservationStatus.active,
        );

        if (activeReservations.length === 0) {
          if (
            reservations.some((reservation) => reservation.status === ReservationStatus.confirmed)
          ) {
            throw new ConflictException({
              code: 'RESERVATION_ALREADY_COMMITTED',
              message: `Cannot release committed reservation for order=${orderId}`,
            });
          }

          return;
        }

        for (const res of activeReservations) {
          const inventoryBalance = await lockInventoryBalance(tx, {
            variantId: res.productVariantId,
            warehouseId: res.warehouseId,
            logger: this.logger,
            context: 'InventoryRelease',
          });

          const beforeQuantity = inventoryBalance.quantity;

          if (inventoryBalance.reservedQuantity < res.quantity) {
            throw new ConflictException({
              code: 'RESERVATION_INCONSISTENT',
              message: `Reserved quantity is lower than reservation quantity for order=${orderId}`,
            });
          }

          await tx.inventoryBalance.update({
            where: { id: inventoryBalance.id },
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
              inventoryBalanceId: inventoryBalance.id,
              productVariantId: res.productVariantId,
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
        const inventoryBalance = await tx.inventoryBalance.upsert({
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
          inventoryBalance.quantity - (inventoryBalance.quantity === quantity ? 0 : quantity);

        await tx.inventoryLog.create({
          data: {
            inventoryBalanceId: inventoryBalance.id,
            productVariantId: variantId,
            warehouseId,
            actionType: ActionType.IMPORT,
            quantityChange: quantity,
            beforeQuantity,
            afterQuantity: inventoryBalance.quantity,
            note: note || 'Stock received',
          },
        });

        return inventoryBalance;
      });
    });
  }

  /**
   * Adjusts stock quantity for a variant in a warehouse.
   */
  async adjustStock(variantId: string, warehouseId: string, newQuantity: number, reason?: string) {
    return SystemContextStore.asInternal('InventoryService', async () => {
      return this.prisma.$transaction(async (tx) => {
        const inventoryBalance = await lockInventoryBalance(tx, {
          variantId,
          warehouseId,
          logger: this.logger,
          context: 'InventoryAdjust',
          notFoundMessage: `Inventory balance not found for variant=${variantId} in warehouse=${warehouseId}`,
        });

        const beforeQuantity = inventoryBalance.quantity;

        const updated = await tx.inventoryBalance.update({
          where: { id: inventoryBalance.id },
          data: { quantity: newQuantity },
        });

        await tx.inventoryLog.create({
          data: {
            inventoryBalanceId: inventoryBalance.id,
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
        const inventoryBalance = await lockInventoryBalance(tx, {
          variantId,
          warehouseId,
          logger: this.logger,
          context: 'InventoryDamage',
          notFoundMessage: 'Inventory balance not found',
        });

        if (!inventoryBalance || inventoryBalance.quantity < quantity) {
          throw new BadRequestException('Insufficient stock to report damage');
        }

        const beforeQuantity = inventoryBalance.quantity;

        const updated = await tx.inventoryBalance.update({
          where: { id: inventoryBalance.id },
          data: {
            quantity: { decrement: quantity },
            damagedQuantity: { increment: quantity },
          },
        });

        await tx.inventoryLog.create({
          data: {
            inventoryBalanceId: inventoryBalance.id,
            productVariantId: variantId,
            warehouseId,
            actionType: ActionType.DAMAGE,
            quantityChange: -quantity,
            beforeQuantity,
            afterQuantity: beforeQuantity - quantity,
            note: reason || 'Damage reported (Moved to damaged pool)',
          },
        });

        return updated;
      });
    });
  }

  /**
   * Retrieves dashboard overview statistics.
   */
  async getOverviewStats() {
    const [physicalItems, inTransitTransfers, discrepanciesCount] = await Promise.all([
      this.prisma.physicalItem.findMany({
        include: {
          productVariant: {
            select: { price: true },
          },
        },
      }),
      this.prisma.inventoryTransfer.count({
        where: { status: 'SHIPPED' },
      }),
      this.prisma.physicalItem.count({
        where: {
          status: { in: ['LOST', 'MISSING'] as any },
        },
      }),
    ]);

    const totalItems = physicalItems.length;
    const rfidTaggedCount = physicalItems.filter((item) => item.rfidTag !== null).length;
    const rfidTaggedPercentage = totalItems > 0 ? (rfidTaggedCount / totalItems) * 100 : 100;

    const totalInsuranceValue = physicalItems
      .filter((item) => ['AVAILABLE', 'RESERVED'].includes(item.status))
      .reduce((sum, item) => sum + Number(item.productVariant.price), 0);

    // Calculate inventory health
    const lowStockThreshold = await this.settings.getNumber('inventory.lowStockThreshold');
    const balances = await this.prisma.inventoryBalance.findMany();
    const totalVariants = balances.length;
    const healthyCount = balances.filter((b) => b.quantity >= lowStockThreshold).length;
    const lowStockCount = balances.filter(
      (b) => b.quantity > 0 && b.quantity < lowStockThreshold,
    ).length;
    const outOfStockCount = balances.filter((b) => b.quantity === 0).length;

    const inventoryHealth = {
      healthy: totalVariants > 0 ? Math.round((healthyCount / totalVariants) * 100) : 100,
      lowStock: totalVariants > 0 ? Math.round((lowStockCount / totalVariants) * 100) : 0,
      deadStock: totalVariants > 0 ? Math.round((outOfStockCount / totalVariants) * 100) : 0,
    };

    return {
      totalInsuranceValue,
      rfidTaggedPercentage: parseFloat(rfidTaggedPercentage.toFixed(1)),
      inTransitCount: inTransitTransfers,
      discrepancyCount: discrepanciesCount,
      serializedItems: totalItems,
      inventoryHealth,
    };
  }

  /**
   * Resolves inventory discrepancies by updating a physical item's status
   * and adjusting the materialized InventoryBalance if necessary.
   */
  async resolveDiscrepancy(
    physicalItemId: string,
    action: 'DEDUCT_LOSS' | 'ADD_SURPLUS' | 'RE_SCANNED',
    targetStatus: 'LOST' | 'MISSING' | 'FOUND' | 'WRITTEN_OFF' | 'AVAILABLE',
    actorId?: string,
    note?: string,
  ) {
    return SystemContextStore.asInternal('InventoryService', async () => {
      return this.prisma.$transaction(async (tx) => {
        const item = await tx.physicalItem.findUnique({
          where: { id: physicalItemId },
        });

        if (!item) {
          throw new BadRequestException('Physical item not found');
        }

        const oldStatus = item.status;

        // 1. Update PhysicalItem status
        const updatedItem = await tx.physicalItem.update({
          where: { id: physicalItemId },
          data: { status: targetStatus as any },
        });

        // 2. Adjust InventoryBalance if the status change affects available stock counts
        // AVAILABLE -> LOST/MISSING/WRITTEN_OFF: decrement available quantity
        // LOST/MISSING/WRITTEN_OFF -> AVAILABLE/FOUND: increment available quantity
        const wasAvailable = oldStatus === 'AVAILABLE';
        const isAvailableNow = targetStatus === 'AVAILABLE' || targetStatus === 'FOUND';

        if (wasAvailable && !isAvailableNow) {
          const balance = await lockInventoryBalance(tx, {
            variantId: item.productVariantId,
            warehouseId: item.warehouseId,
            logger: this.logger,
            context: 'ResolveDiscrepancyDeduct',
          });

          await tx.inventoryBalance.update({
            where: { id: balance.id },
            data: { quantity: { decrement: 1 } },
          });

          await tx.inventoryLog.create({
            data: {
              inventoryBalanceId: balance.id,
              productVariantId: item.productVariantId,
              warehouseId: item.warehouseId,
              actionType: ActionType.DAMAGE,
              quantityChange: -1,
              beforeQuantity: balance.quantity,
              afterQuantity: balance.quantity - 1,
              referenceId: physicalItemId,
              referenceType: 'DISCREPANCY',
              note: note || `Discrepancy resolved: moved to ${targetStatus}`,
            },
          });
        } else if (!wasAvailable && isAvailableNow) {
          const balance = await tx.inventoryBalance.upsert({
            where: {
              productVariantId_warehouseId: {
                productVariantId: item.productVariantId,
                warehouseId: item.warehouseId,
              },
            },
            create: {
              productVariantId: item.productVariantId,
              warehouseId: item.warehouseId,
              quantity: 1,
            },
            update: {
              quantity: { increment: 1 },
            },
          });

          const beforeQuantity = balance.quantity - 1;

          await tx.inventoryLog.create({
            data: {
              inventoryBalanceId: balance.id,
              productVariantId: item.productVariantId,
              warehouseId: item.warehouseId,
              actionType: ActionType.ADJUSTMENT,
              quantityChange: 1,
              beforeQuantity,
              afterQuantity: balance.quantity,
              referenceId: physicalItemId,
              referenceType: 'DISCREPANCY',
              note: note || `Discrepancy resolved: restored to AVAILABLE (status: ${targetStatus})`,
            },
          });
        }

        // 3. Log Audit
        await tx.inventoryAuditLog.create({
          data: {
            actorId: actorId || '00000000-0000-0000-0000-000000000000',
            action: 'RESOLVE_DISCREPANCY',
            entityName: 'PhysicalItem',
            entityId: physicalItemId,
            beforeState: { status: oldStatus },
            afterState: { status: targetStatus, action, note },
          },
        });

        return updatedItem;
      });
    });
  }

  /**
   * Retrieves all stock levels matching optional filters.
   */
  async getAllStockLevels(filters: { warehouseId?: string; variantId?: string }) {
    return this.prisma.inventoryBalance.findMany({
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
    return this.prisma.inventoryBalance.findMany({
      where: { productVariantId: variantId },
      include: { warehouse: true },
    });
  }
}
