import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PostgresAdvisoryLock
 * Ensures mutual exclusion for seeding across multiple instances.
 */
export class PostgresAdvisoryLock {
  private static readonly logger = new Logger('AdvisoryLock');
  private static readonly SEED_LOCK_ID = 1337420; // Constant ID for the seed lock

  /**
   * Tries to acquire a lock.
   * Returns true if lock was acquired, false otherwise.
   */
  static async acquire(prisma: PrismaClient): Promise<boolean> {
    this.logger.log('Attempting to acquire database advisory lock for seeding...');

    // pg_try_advisory_lock returns true if lock is available
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT pg_try_advisory_lock(${this.SEED_LOCK_ID}) as locked;`,
    );

    const isLocked = result[0]?.locked === true;

    if (isLocked) {
      this.logger.log('✅ Lock acquired.');
    } else {
      this.logger.warn('⚠️ Seed already running in another instance. Skipping.');
    }

    return isLocked;
  }

  /**
   * Releases the lock.
   */
  static async release(prisma: PrismaClient): Promise<void> {
    this.logger.log('Releasing advisory lock...');
    await prisma.$queryRawUnsafe(`SELECT pg_advisory_unlock(${this.SEED_LOCK_ID});`);
    this.logger.log('🔓 Lock released.');
  }
}
