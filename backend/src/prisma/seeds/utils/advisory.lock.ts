import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Ensures mutual exclusion for seeding across multiple instances.
 */
export class PostgresAdvisoryLock {
  private static readonly logger = new Logger('AdvisoryLock');
  private static readonly SEED_LOCK_ID = 1337420;

  static async acquire(prisma: PrismaClient): Promise<boolean> {
    this.logger.log('Attempting to acquire database advisory lock for seeding...');

    const result = await prisma.$queryRaw<Array<{ locked: boolean }>>`
      SELECT pg_try_advisory_lock(${this.SEED_LOCK_ID}) as locked;
    `;

    const isLocked = result[0]?.locked === true;

    if (isLocked) {
      this.logger.log('Lock acquired.');
    } else {
      this.logger.warn('Seed already running in another instance. Skipping.');
    }

    return isLocked;
  }

  static async release(prisma: PrismaClient): Promise<void> {
    this.logger.log('Releasing advisory lock...');
    await prisma.$queryRaw`
      SELECT pg_advisory_unlock(${this.SEED_LOCK_ID});
    `;
    this.logger.log('Lock released.');
  }
}
