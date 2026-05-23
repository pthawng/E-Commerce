import { PrismaClient } from '@prisma/client';
import { IntegrationTestBase } from '../utils/integration-test-base';

/**
 * INTEGRATION TEST: Soft-Delete Raw Query Leak Detection
 *
 * Trust but verify. The Prisma Extension provides
 * automatic filtering via ORM methods. This test suite verifies:
 *
 * - ORM methods (findMany, count, aggregate) never return soft-deleted records.
 * - Raw SQL without filters can still see deleted records (documented risk).
 * - Raw SQL with a "deletedAt IS NULL" filter works correctly.
 *
 * The purpose of test #2 is to act as an alarm to enforce that
 * if a developer patches raw queries to remove filters, this test will catch it.
 * If raw queries start failing this test, it indicates database-level Row Level Security
 * needs to be implemented.
 */
describe('[Integration] Soft-Delete Safety', () => {
  const base = new IntegrationTestBase();
  let prisma: PrismaClient;
  let softDeletedUserId: string;
  let activeUserId: string;

  beforeAll(async () => {
    await base.setup();
    prisma = base.prisma;

    // Create a role (required for user FK)
    const role = await prisma.role.upsert({
      where: { slug: 'CUSTOMER' },
      update: {},
      create: { name: 'Customer', slug: 'CUSTOMER', description: 'Test customer' },
    });

    // Create one "active" user and one "soft-deleted" user
    const active = await prisma.user.create({
      data: {
        email: `active-${Date.now()}@test.com`,
        passwordHash: 'hash',
        fullName: 'Active User',
      },
    });
    activeUserId = active.id;

    const deleted = await prisma.user.create({
      data: {
        email: `deleted-${Date.now()}@test.com`,
        passwordHash: 'hash',
        fullName: 'Deleted User',
        deletedAt: new Date(), // <-- soft deleted
      },
    });
    softDeletedUserId = deleted.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [activeUserId, softDeletedUserId] } },
    });
    await base.teardown();
  });

  it('findMany should NOT return soft-deleted users (ORM extension)', async () => {
    const users = await prisma.user.findMany({
      where: { id: { in: [activeUserId, softDeletedUserId] } },
    });
    const ids = users.map((u) => u.id);
    expect(ids).toContain(activeUserId);
    expect(ids).not.toContain(softDeletedUserId);
  });

  it('count should NOT include soft-deleted users', async () => {
    const count = await prisma.user.count({
      where: { id: { in: [activeUserId, softDeletedUserId] } },
    });
    expect(count).toBe(1);
  });

  it('findUnique by softDeleted ID should return null', async () => {
    const user = await prisma.user.findUnique({ where: { id: softDeletedUserId } });
    expect(user).toBeNull();
  });

  /**
   * Risk documentation test
   * This test intentionally demonstrates the raw query bypass risk.
   * If this starts failing (i.e., raw queries stop showing deleted records),
   * it likely means database-level Row Level Security has been implemented.
   */
  it('$queryRaw WITHOUT deletedAt filter CAN leak soft-deleted records (documented risk)', async () => {
    const results = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "User" WHERE id = ${softDeletedUserId}
    `;
    // This SHOULD return the record — demonstrating the bypass risk.
    // The test documents and tracks this behavior explicitly.
    expect(results.length).toBe(1);
  });

  it('$queryRaw WITH deletedAt IS NULL filter correctly hides deleted records', async () => {
    const results = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "User"
      WHERE id = ${softDeletedUserId}
      AND "deletedAt" IS NULL
    `;
    expect(results.length).toBe(0);
  });
});
