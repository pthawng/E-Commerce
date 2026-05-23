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

  // 1. Ensure each warehouse has at least one location
  const locationsMap = new Map<string, string>(); // warehouseId -> locationId
  for (const wh of warehouses) {
    const existingLoc = await prisma.inventoryLocation.findFirst({
      where: { warehouseId: wh.id },
    });

    if (existingLoc) {
      locationsMap.set(wh.id, existingLoc.id);
    } else {
      const loc = await prisma.inventoryLocation.create({
        data: {
          warehouseId: wh.id,
          name: 'Main Shelf A-1',
          code: `LOC-${wh.code}-A1`,
          type: 'SHELF',
        },
      });
      locationsMap.set(wh.id, loc.id);
      logger.log(`📍 Created default location for ${wh.code}`);
    }
  }

  let count = 0;
  let physicalCount = 0;

  for (const v of variants) {
    // Allocate stock in one warehouse based on SKU
    const wh = warehouses[v.sku.length % warehouses.length];
    const locId = locationsMap.get(wh.id);

    // 2. Upsert InventoryItem (Aggregate Stock)
    const quantity = 50; // Fixed default for demo
    await prisma.inventoryItem.upsert({
      where: {
        productVariantId_warehouseId: {
          productVariantId: v.id,
          warehouseId: wh.id,
        },
      },
      update: {
        quantity: { increment: quantity }, // Add more stock if it exists
      },
      create: {
        productVariantId: v.id,
        warehouseId: wh.id,
        quantity,
        shelfLocation: 'DEMO-' + (count % 100),
      },
    });
    count++;

    // 3. Create some PhysicalItems (Serialized Stock) - 3 per variant
    const numPhysical = 3;
    for (let j = 0; j < numPhysical; j++) {
      const serialNumber = `SN-${v.sku}-${j}`;

      // Check if serial exists to prevent unique constraint error
      const existingPhysical = await prisma.physicalItem.findUnique({
        where: { serialNumber },
      });

      if (!existingPhysical) {
        await prisma.physicalItem.create({
          data: {
            productVariantId: v.id,
            locationId: locId,
            serialNumber,
            status: 'AVAILABLE',
            metadata: {
              condition: 'New',
              source: 'Demo Seed',
            },
          },
        });
        physicalCount++;
      }
    }
  }

  logger.log(`✅ Initialized aggregate stock for ${count} items.`);
  logger.log(`✅ Created ${physicalCount} serialized physical items.`);
}
