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

async function main() {
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  const variantCount = await prisma.productVariant.count();

  console.log(`Products: ${productCount}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Variants: ${variantCount}`);

  if (productCount === 8) {
    console.log('Verification SUCCESS: Found 8 products.');
  } else {
    console.log(`Verification FAILED: Found ${productCount} products, expected 8.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
