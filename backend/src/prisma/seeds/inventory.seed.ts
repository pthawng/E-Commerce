import { PrismaClient } from '@prisma/client';
import { SystemContextStore } from '../../common/context/system-context.store';


export async function seedInventory(prisma: PrismaClient) {
  console.log('🚀 Seeding Inventory (Stock Allocation)...');

  // Wrap in SystemContextStore to bypass Invariant Guards
  await SystemContextStore.asInternal('MasterSeed', async () => {
    const warehouses = await prisma.warehouse.findMany();
    const variants = await prisma.productVariant.findMany();

    if (warehouses.length === 0 || variants.length === 0) {
      console.warn('⚠️ No warehouses or variants found. Skipping inventory seed.');
      return;
    }

    let count = 0;
    for (const v of variants) {
      // Allocate stock in at least one warehouse
      const wh = warehouses[v.sku.length % warehouses.length];
      const quantity = Math.floor(Math.random() * 90) + 10; // 10-100 units

      await prisma.inventoryItem.upsert({
        where: { productVariantId_warehouseId: { productVariantId: v.id, warehouseId: wh.id } },
        update: { quantity },
        create: { 
          productVariantId: v.id, 
          warehouseId: wh.id, 
          quantity,
          shelfLocation: 'A-' + (count % 100)
        },
      });
      count++;
    }

    console.log(`✅ Allocated stock for ${count} variants.`);
  });
}
