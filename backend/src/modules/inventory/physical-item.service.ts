import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ItemStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PhysicalItemService {
  private readonly logger = new Logger(PhysicalItemService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a new physical item (e.g., a specific diamond ring).
   * Includes integrity checks and atomic creation.
   */
  async registerItem(data: {
    productVariantId: string;
    serialNumber?: string;
    rfidTag?: string;
    locationId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    this.logger.log(`Registering physical item: ${data.serialNumber || 'unserialized'}`);

    const integrityHash = this.generateIntegrityHash(data);

    return this.prisma.physicalItem.create({
      data: {
        ...data,
        status: ItemStatus.AVAILABLE,
        integrityHash,
      },
    });
  }

  /**
   * Transitions an item's status with audit trail support.
   * Verifies data integrity before any status transition.
   */
  async updateStatus(id: string, status: ItemStatus, metadata?: Prisma.InputJsonValue) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.physicalItem.findUnique({ where: { id } });
      if (!item) throw new Error('Physical item not found');

      // 1. Verify Integrity Hash before updating
      const currentHash = this.generateIntegrityHash(item);
      if (item.integrityHash && item.integrityHash !== currentHash) {
        this.logger.error(`INTEGRITY BREACH: Physical item ${id} has been tampered with!`);
        throw new BadRequestException('Data integrity violation detected for this item.');
      }

      // 2. Perform Update
      const updatedItem = await tx.physicalItem.update({
        where: { id },
        data: {
          status,
          metadata: metadata
            ? (Object.assign({}, (item.metadata as object) || {}, metadata) as any)
            : item.metadata,
          // If properties that affect the hash change, we should update the hash too.
          // For now, only status and metadata change, which are NOT in our current hash payload.
        },
      });

      // 3. Auto-sync with quantitative InventoryItem
      await this.syncInventoryCount(
        tx,
        item.productVariantId,
        item.locationId,
        status,
        item.status,
      );

      return updatedItem;
    });
  }

  /**
   * Warehouse-aware inventory sync.
   * PhysicalItem = single source of truth.
   * InventoryItem = materialized cache (derived).
   */
  private async syncInventoryCount(
    tx: Prisma.TransactionClient,
    variantId: string,
    locationId: string | null,
    newStatus: ItemStatus,
    oldStatus: ItemStatus,
  ) {
    if (!locationId) return;

    const location = await tx.inventoryLocation.findUnique({
      where: { id: locationId },
      select: { warehouseId: true },
    });
    if (!location?.warehouseId) return;

    const warehouseId = location.warehouseId;

    // Advisory lock: serialize sync for this variant+warehouse pair
    await tx.$executeRawUnsafe(
      `SELECT pg_advisory_xact_lock(hashtext($1))`,
      `inv_sync:${variantId}:${warehouseId}`,
    );

    // Derive counts from PhysicalItem (single source of truth)
    const [availableCount, reservedCount] = await Promise.all([
      tx.physicalItem.count({
        where: {
          productVariantId: variantId,
          status: ItemStatus.AVAILABLE,
          location: { warehouseId },
        },
      }),
      tx.physicalItem.count({
        where: {
          productVariantId: variantId,
          status: ItemStatus.RESERVED,
          location: { warehouseId },
        },
      }),
    ]);

    await tx.inventoryItem.upsert({
      where: {
        productVariantId_warehouseId: {
          productVariantId: variantId,
          warehouseId,
        },
      },
      update: {
        quantity: availableCount,
        reservedQuantity: reservedCount,
        updatedAt: new Date(),
      },
      create: {
        productVariantId: variantId,
        warehouseId,
        quantity: availableCount,
        reservedQuantity: reservedCount,
      },
    });
  }

  /**
   * Generates a deterministic hash for item properties.
   * Includes core physical identification tokens.
   */
  private generateIntegrityHash(item: {
    productVariantId: string;
    serialNumber?: string | null;
    rfidTag?: string | null;
  }): string {
    const payload = JSON.stringify({
      productVariantId: item.productVariantId,
      serialNumber: item.serialNumber || '',
      rfidTag: item.rfidTag || '',
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }
}
