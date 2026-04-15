import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import { EnvironmentGuard } from './seeds/utils/environment.guard';

import * as fs from 'fs';

const logger = new Logger('DBReset');

// Load environment variables (look for .env or .env.development)
const envRoot = path.join(__dirname, '../../');
const envPath = fs.existsSync(path.join(envRoot, '.env'))
  ? path.join(envRoot, '.env')
  : path.join(envRoot, '.env.development');

dotenv.config({ path: envPath });

async function main() {
  logger.log('🧨 Initializing Database Reset Process...');

  const connStr = process.env.DATABASE_URL || '';
  if (!connStr) {
    logger.error('❌ DATABASE_URL is not defined in environment variables.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: connStr });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const isProd = EnvironmentGuard.isProduction();
    const forceFlag = process.argv.includes('--force-production-reset');

    if (isProd) {
      if (!forceFlag) {
        logger.error('🛡️  SAFETY BLOCK: You are attempting to reset a PRODUCTION database.');
        logger.error('To proceed, you MUST use the flag: --force-production-reset');
        logger.warn('Example: npm run db:reset -- --force-production-reset');
        process.exit(1);
      }
      logger.warn('⚠️  CRITICAL: Forced reset on PRODUCTION in progress...');
    } else {
      logger.log('🏠 Environment: DEVELOPMENT. Proceeding with reset...');
    }

    // 1. Get all table names in the public schema
    const tables: any[] = await prisma.$queryRaw`
      SELECT tablename::text 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE '_prisma_migrations';
    `;

    if (tables.length === 0) {
      logger.log('✅ No tables found to reset.');
      return;
    }

    const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ');

    logger.log(`🧹 Truncating tables: ${tables.length} tables identified.`);

    // 2. Execute TRUNCATE with CASCADE to handle foreign key constraints
    // Note: We use executeRawUnsafe here because table names cannot be parameterized traditionally in TRUNCATE
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);

    logger.log(
      '✨ Database reset successfully. All data cleared and identity sequences restarted.',
    );

    if (isProd) {
      logger.warn('🔔 Reminder: Production data has been WIPED.');
    }
  } catch (error) {
    logger.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  logger.error('Fatal reset error:', e);
  process.exit(1);
});
