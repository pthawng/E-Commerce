import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const logger = new Logger('DemoInventory');

export async function seedInventory(prisma: PrismaClient) {
  logger.log('🚀 Seeding Inventory (Initial Stock Allocation)...');

  const warehouses = await prisma.warehouse.findMany();
  const variants = await prisma.productVariant.findMany();

  if (warehouses.length === 0 || variants.length === 0) {
    logger.warn('⚠️ No warehouses or variants found. Skipping demo inventory seed.');
    return;
  }

  let count = 0;
  for (const v of variants) {
    // Allocate stock in one warehouse
    const wh = warehouses[v.sku.length % warehouses.length];

    // Safety check: Only seed if inventory record doesn't exist
    // This prevents overwriting real production/dev stock values
    const existing = await prisma.inventoryItem.findUnique({
      where: { productVariantId_warehouseId: { productVariantId: v.id, warehouseId: wh.id } },
    });

    if (!existing) {
      const quantity = 100; // Fixed default for demo
      await prisma.inventoryItem.create({
        data: {
          productVariantId: v.id,
          warehouseId: wh.id,
          quantity,
          shelfLocation: 'DEMO-' + (count % 100),
        },
      });
      count++;
    }
  }

  logger.log(`✅ Initialized stock for ${count} new demo items.`);
}
