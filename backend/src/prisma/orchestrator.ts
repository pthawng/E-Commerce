import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import { Logger } from '@nestjs/common';
import { SystemContextStore } from '../common/context/system-context.store';
import { EnvironmentGuard } from './seeds/utils/environment.guard';
import { PostgresAdvisoryLock } from './seeds/utils/advisory.lock';
import { SeedHistoryTracker } from './seeds/utils/history';
import { SYSTEM_REGISTRY } from './seeds/seed-registry';
import { demoSeeds } from './seeds/demo/index';

import * as fs from 'fs';

const logger = new Logger('MasterSeed');

// Load environment variables (look for .env or .env.development)
const envRoot = path.join(__dirname, '../../');
const envPath = fs.existsSync(path.join(envRoot, '.env'))
  ? path.join(envRoot, '.env')
  : path.join(envRoot, '.env.development');

dotenv.config({ path: envPath });

const connStr = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString: connStr });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  logger.log('🚀 Starting Versioned Seeding Process...');

  // 1. Concurrency Protection
  const acquired = await PostgresAdvisoryLock.acquire(prisma);
  if (!acquired) return;

  try {
    await SystemContextStore.asInternal('MasterSeed', async () => {
      
      // 2. Versioned System Seeds (Core)
      logger.log(`Checking ${SYSTEM_REGISTRY.length} versioned seeds...`);
      for (const seed of SYSTEM_REGISTRY) {
        const isApplied = await SeedHistoryTracker.isApplied(prisma, seed.version);
        
        if (!isApplied) {
          logger.log(`⚙️ Applying ${seed.version}: ${seed.name}...`);
          
          await prisma.$transaction(async (tx) => {
            // @ts-ignore - tx as prisma is usually fine for basic operations
            await seed.run(tx);
            await SeedHistoryTracker.markApplied(tx as any, seed);
          });
          
          logger.log(`✅ ${seed.version} applied.`);
        } else {
          // logger.debug(`${seed.version} already applied. Skipping.`);
        }
      }

      // 3. Demo Data (Non-production only)
      if (EnvironmentGuard.isDevelopment()) {
        logger.log('🎮 Environment is DEVELOPMENT. Running demo seeds...');
        for (const demoSeed of demoSeeds) {
          logger.log(`📦 Running demo: ${demoSeed.name}...`);
          await demoSeed.run(prisma);
        }
      } else {
        logger.log('🛡️ Environment is PRODUCTION. Demo seeds skipped.');
      }

      logger.log('✨ Seeding process completed successfully.');
    });
  } catch (error) {
    logger.error('❌ Seeding failed with error:', error);
    process.exit(1);
  } finally {
    await PostgresAdvisoryLock.release(prisma);
  }
}

main()
  .catch((e) => {
    logger.error('Fatal seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
