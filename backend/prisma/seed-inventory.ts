import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connStr = process.env.DATABASE_URL || '';
const adapter = new PrismaPg({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Initializing Inventory ---');

  // 1. Create Default Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: { isActive: true },
    create: {
      code: 'WH-MAIN',
      name: 'Main Warehouse',
      isActive: true,
    },
  });
  console.log(`Warehouse ready: ${warehouse.name} (${warehouse.code})`);

  // 2. Fetch all variants
  const variants = await prisma.productVariant.findMany();
  console.log(`Found ${variants.length} variants to update.`);

  // 3. Populate Stock
  for (const variant of variants) {
    await prisma.inventoryItem.upsert({
      where: {
        productVariantId_warehouseId: {
          productVariantId: variant.id,
          warehouseId: warehouse.id,
        },
      },
      update: {
        quantity: 100, // Reset to 100 for testing
      },
      create: {
        productVariantId: variant.id,
        warehouseId: warehouse.id,
        quantity: 100,
      },
    });
  }

  console.log('--- Inventory Initialization Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
