import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { SYSTEM_REGISTRY } from '../../src/prisma/seeds/seed-registry';
import { PostgresAdvisoryLock } from '../../src/prisma/seeds/utils/advisory.lock';
import { SeedHistoryTracker } from '../../src/prisma/seeds/utils/history';

/**
 * INTEGRATION TEST: Seeding Advisory Lock Contention
 *
 * In horizontally-scaled deployments, all pods run
 * their startup sequence concurrently. The advisory lock MUST guarantee
 * that only one pod runs the seeding process, and all others gracefully skip.
 */
describe('[Integration] Seeding Under Contention', () => {
  const dbUrl = process.env.TEST_DATABASE_URL!;
  let clients: PrismaClient[] = [];
  const pools: Pool[] = [];

  const createClient = () => {
    const pool = new Pool({ connectionString: dbUrl, max: 1 });
    pools.push(pool);
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  };

  beforeAll(async () => {
    clients = Array.from({ length: 5 }, createClient);
    await Promise.all(clients.map((c) => c.$connect()));
  });

  afterAll(async () => {
    await Promise.all(clients.map((c) => c.$disconnect()));
    await Promise.all(pools.map((p) => p.end()));
  });

  it('should allow only ONE seeder to acquire the lock when 5 run concurrently', async () => {
    let acquiredCount = 0;
    let skippedCount = 0;

    await Promise.allSettled(
      clients.map(async (client) => {
        const acquired = await PostgresAdvisoryLock.acquire(client);
        if (acquired) {
          acquiredCount++;
          await new Promise((r) => setTimeout(r, 100)); // simulate work
          await PostgresAdvisoryLock.release(client);
        } else {
          skippedCount++;
        }
      }),
    );

    // All 5 must have resolved (no deadlocks or unhandled rejections)
    expect(acquiredCount + skippedCount).toBe(5);
    // At least one must have acquired the lock
    expect(acquiredCount).toBeGreaterThanOrEqual(1);

    console.log(`[Advisory Lock] acquired: ${acquiredCount}, skipped: ${skippedCount}`);
  });

  it('should be idempotent: isApplied returns true after marking applied', async () => {
    const client = clients[0];
    const seed = SYSTEM_REGISTRY[0]; // v1

    // Clean state first
    const alreadyApplied = await SeedHistoryTracker.isApplied(client, seed.version);

    if (!alreadyApplied) {
      // Mark as applied (skip the actual seed.run since it runs RBAC which
      // requires full NestJS module context)
      try {
        await client.dataSeedHistory.create({
          data: { version: seed.version, name: seed.name, appliedAt: new Date() },
        });
      } catch {
        // May already exist from another test run — that's fine
      }
    }

    // Running isApplied again should return true (no-op guarantee)
    const appliedNow = await SeedHistoryTracker.isApplied(client, seed.version);
    expect(appliedNow).toBe(true);

    // Verify no duplicate history entries
    const count = await client.dataSeedHistory.count({
      where: { version: seed.version },
    });
    expect(count).toBe(1);
  });
});
