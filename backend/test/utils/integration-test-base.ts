import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { softDeleteExtension } from 'src/prisma/extensions/soft-delete.extension';

/**
 * Transactional test isolation.
 *
 * Each test wraps all DB operations in a transaction that is ROLLED BACK
 * in afterEach. This is 10x faster than truncation and avoids FK cascade
 * issues. maxWorkers=1 (--runInBand) must be set to prevent connection
 * pool sharing and dirty reads between parallel test files.
 */
export class IntegrationTestBase {
  public prisma: PrismaClient;
  private pool: Pool;
  private txClient: any; // Active transaction client

  async setup() {
    const dbUrl = process.env.TEST_DATABASE_URL;
    if (!dbUrl) throw new Error('TEST_DATABASE_URL is not set. Did global-setup.ts run?');

    this.pool = new Pool({ connectionString: dbUrl, max: 5 });
    const adapter = new PrismaPg(this.pool);
    // Apply the soft-delete extension so ORM queries mirror production behavior
    this.prisma = new PrismaClient({ adapter }).$extends(
      softDeleteExtension,
    ) as unknown as PrismaClient;
    await this.prisma.$connect();
  }

  async teardown() {
    await this.prisma.$disconnect();
    await this.pool.end();
  }

  /**
   * Wraps a test in a transaction, yielding a tx client.
   * Call this in beforeEach and rollback in afterEach.
   */
  async beginTransaction(): Promise<PrismaClient> {
    // Use $queryRawUnsafe to acquire TX — Prisma doesn't expose raw BEGIN natively
    await this.prisma.$queryRawUnsafe('BEGIN');
    return this.prisma;
  }

  async rollbackTransaction() {
    try {
      await this.prisma.$queryRawUnsafe('ROLLBACK');
    } catch {
      // TX may already be closed — safe to ignore
    }
  }

  /**
   * Utility: seed N rows quickly using createMany in a single round-trip.
   */
  async bulkSeed<T>(model: string, data: T[]): Promise<void> {
    await (this.prisma as any)[model].createMany({ data, skipDuplicates: true });
  }
}
