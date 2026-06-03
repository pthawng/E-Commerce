import { SystemContextStore } from '@common/context/system-context.store';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ItemStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * InventoryReconciliationService
 *
 * Scheduled job to detect drift between PhysicalItem counts
 * and InventoryBalance quantities. Alerts on any mismatch.
 *
 * PhysicalItem = single source of truth
 * InventoryBalance = materialized cache
 */
@Injectable()
export class InventoryReconciliationService {
  private readonly logger = new Logger(InventoryReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async reconcile() {
    return SystemContextStore.asInternal(InventoryReconciliationService.name, async () => {
      this.logger.log('Starting inventory reconciliation...');

      const inventoryBalances = await this.prisma.inventoryBalance.findMany({
        select: {
          id: true,
          productVariantId: true,
          warehouseId: true,
          quantity: true,
          reservedQuantity: true,
        },
      });

      let driftCount = 0;

      for (const item of inventoryBalances) {
        const [availableCount, reservedCount] = await Promise.all([
          this.prisma.physicalItem.count({
            where: {
              productVariantId: item.productVariantId,
              status: ItemStatus.AVAILABLE,
              warehouseId: item.warehouseId,
            },
          }),
          this.prisma.physicalItem.count({
            where: {
              productVariantId: item.productVariantId,
              status: ItemStatus.RESERVED,
              warehouseId: item.warehouseId,
            },
          }),
        ]);

        if (item.quantity !== availableCount || item.reservedQuantity !== reservedCount) {
          driftCount++;
          this.logger.warn(
            `DRIFT DETECTED: variant=${item.productVariantId}, wh=${item.warehouseId} | ` +
              `InventoryBalance(qty=${item.quantity}, res=${item.reservedQuantity}) vs ` +
              `PhysicalItem(available=${availableCount}, reserved=${reservedCount})`,
          );

          // Auto-heal: update InventoryBalance to match PhysicalItem
          await this.prisma.inventoryBalance.update({
            where: { id: item.id },
            data: {
              quantity: availableCount,
              reservedQuantity: reservedCount,
              updatedAt: new Date(),
            },
          });
        }
      }

      if (driftCount === 0) {
        this.logger.log('Reconciliation complete: no drift detected.');
      } else {
        this.logger.warn(`Reconciliation complete: ${driftCount} drift(s) auto-healed.`);
      }
    });
  }
}
