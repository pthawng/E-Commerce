import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { AllocationItem } from './inventory.service';

/**
 * InventoryAllocatorService
 *
 * Decides WHICH warehouse(s) to allocate stock from.
 * Default strategy: Largest-Stock-First (greedy).
 *
 * Future extension: NearestWarehouseStrategy using customer address.
 */
@Injectable()
export class InventoryAllocatorService {
  private readonly logger = new Logger(InventoryAllocatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Allocate stock across warehouses for given items.
   *
   * Strategy: For each item, fetch all warehouses with stock,
   * sort by available (desc), greedily allocate.
   *
   * @returns Array of allocation items (variantId + warehouseId + quantity)
   * @throws ConflictException if total available < requested
   */
  async allocate(items: Array<{ variantId: string; quantity: number }>): Promise<AllocationItem[]> {
    const allocations: AllocationItem[] = [];

    for (const item of items) {
      const inventoryItems = await this.prisma.inventoryItem.findMany({
        where: { productVariantId: item.variantId },
        include: {
          warehouse: { select: { id: true, name: true } },
        },
        orderBy: { quantity: 'desc' },
      });

      // Calculate available per warehouse
      const warehouseStocks = inventoryItems.map((inv) => ({
        warehouseId: inv.warehouseId,
        warehouseName: inv.warehouse.name,
        available: inv.quantity - inv.reservedQuantity,
      }));

      // Sort by available descending (largest-stock-first)
      warehouseStocks.sort((a, b) => b.available - a.available);

      let remaining = item.quantity;
      const totalAvailable = warehouseStocks.reduce((sum, w) => sum + Math.max(0, w.available), 0);

      if (totalAvailable < item.quantity) {
        throw new ConflictException(
          `Insufficient total stock for variant ${item.variantId}: ` +
            `available=${totalAvailable}, requested=${item.quantity}`,
        );
      }

      for (const ws of warehouseStocks) {
        if (remaining <= 0) break;
        if (ws.available <= 0) continue;

        const allocQty = Math.min(remaining, ws.available);
        allocations.push({
          variantId: item.variantId,
          warehouseId: ws.warehouseId,
          quantity: allocQty,
        });

        remaining -= allocQty;

        this.logger.debug(
          `Allocated ${allocQty} from ${ws.warehouseName} for variant ${item.variantId}`,
        );
      }

      if (remaining > 0) {
        // Should not reach here due to check above, but safety net
        throw new ConflictException(`Could not fully allocate variant ${item.variantId}`);
      }
    }

    return allocations;
  }
}
