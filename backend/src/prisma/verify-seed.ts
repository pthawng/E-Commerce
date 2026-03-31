import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connStr = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString: connStr });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('🔍 Verifying Seed Data...');
  
  const counts = {
    permissions: await prisma.permission.count(),
    roles: await prisma.role.count(),
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    warehouses: await prisma.warehouse.count(),
    inventory: await prisma.inventoryItem.count(),
    shipping: await prisma.shippingMethod.count(),
  };

  console.log(`- Permissions: ${counts.permissions}`);
  console.log(`- Roles: ${counts.roles}`);
  console.log(`- Users: ${counts.users}`);
  console.log(`- Categories: ${counts.categories}`);
  console.log(`- Products: ${counts.products}`);
  console.log(`- Variants: ${counts.variants}`);
  console.log(`- Warehouses: ${counts.warehouses}`);
  console.log(`- Inventory: ${counts.inventory}`);
  console.log(`- Shipping: ${counts.shipping}`);


  if (counts.products >= 50 && counts.inventory > 0) {
    console.log('✅ SEED SUCCESS: 50+ products and stock are present.');
  } else {
    console.error('❌ SEED INCOMPLETE: Missing key records.');
  }
}

verify()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
