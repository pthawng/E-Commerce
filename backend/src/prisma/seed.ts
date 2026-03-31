import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import { SystemContextStore } from '../common/context/system-context.store';

// Import modular seeds
import { seedRBAC } from './seeds/rbac.seed';
import { seedUsers } from './seeds/user.seed';
import { seedCatalog } from './seeds/catalog.seed';
import { seedInventory } from './seeds/inventory.seed';
import { seedLogistics } from './seeds/logistics.seed';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connStr = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString: connStr });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const mode = process.env.SEED_MODE || 'dev';
  console.log(`\n🌟 Ray Paradis Master Seed System [Mode: ${mode.toUpperCase()}]`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // We wrap everything in SystemContextStore to bypass Invariant Guards for all models
    await SystemContextStore.asInternal('MasterSeed', async () => {
      
      // 1. Mandatory System Layer
      await seedRBAC(prisma);
      await seedUsers(prisma);
      await seedLogistics(prisma);

      // 2. Demo/Dev Layer
      if (mode !== 'prod') {
        await seedCatalog(prisma); // Factory generates 50 products
        await seedInventory(prisma);
      }

      console.log('\n✨ Seeding process completed successfully.');
    });
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
