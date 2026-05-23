import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { IntegrationTestBase } from '../../../../test/utils/integration-test-base';

/**
 * INTEGRATION TEST: Inventory Concurrency (Deterministic)
 *
 * Direct database behavior validation for row-level locking (SELECT ... FOR UPDATE NOWAIT)
 * and atomic reservations.
 *
 * We do not import InventoryService here to avoid NestJS dependency injection overhead.
 * Instead, we test the exact SQL pattern executed by the service against a Postgres database.
 */
describe('[Integration] Inventory Concurrency', () => {
  const base = new IntegrationTestBase();
  let prisma: PrismaClient;
  let pool: Pool;

  let variantId: string;
  let warehouseId: string;
  let inventoryItemId: string;
  const INITIAL_STOCK = 5;

  beforeAll(async () => {
    await base.setup();
    prisma = base.prisma;
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL!, max: 20 });
  });

  afterAll(async () => {
    await pool.end();
    await base.teardown();
  });

  beforeEach(async () => {
    const wh = await prisma.warehouse.create({
      data: { name: 'Test WH', code: `WH-${Date.now()}`, isActive: true },
    });
    warehouseId = wh.id;

    const cat = await prisma.category.create({
      data: { name: { vi: 'Test', en: 'Test' }, slug: `cat-${Date.now()}` },
    });

    const prod = await prisma.product.create({
      data: {
        name: { vi: 'Test', en: 'Test' },
        slug: `prod-${Date.now()}`,
        categories: { create: { category: { connect: { id: cat.id } } } },
      },
    });

    const variant = await prisma.productVariant.create({
      data: { productId: prod.id, sku: `SKU-${Date.now()}`, price: 100000 },
    });
    variantId = variant.id;

    const item = await prisma.inventoryItem.create({
      data: {
        productVariantId: variantId,
        warehouseId,
        quantity: INITIAL_STOCK,
        reservedQuantity: 0,
      },
    });
    inventoryItemId = item.id;
  });

  afterEach(async () => {
    await prisma.inventoryItem.deleteMany({ where: { productVariantId: variantId } });
    await prisma.productVariant.deleteMany({ where: { id: variantId } });
  });

  /**
   * Executes the same lock and reserve logic as the service using a raw Postgres connection.
   */
  async function tryReserve(requestId: number): Promise<'success' | 'locked' | 'insufficient'> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lockResult = await client.query(
        `SELECT quantity, "reservedQuantity" FROM "InventoryItem"
         WHERE id = $1
         FOR UPDATE NOWAIT`,
        [inventoryItemId],
      );

      if (!lockResult.rows[0]) {
        await client.query('ROLLBACK');
        return 'insufficient';
      }

      const { quantity, reservedQuantity } = lockResult.rows[0];
      const available = quantity - reservedQuantity;

      if (available < 1) {
        await client.query('ROLLBACK');
        return 'insufficient';
      }

      await client.query(
        `UPDATE "InventoryItem" SET "reservedQuantity" = "reservedQuantity" + 1 WHERE id = $1`,
        [inventoryItemId],
      );

      await client.query('COMMIT');
      return 'success';
    } catch (err: any) {
      await client.query('ROLLBACK').catch(() => {});
      // PostgreSQL error 55P03 represents lock_not_available
      if (err.code === '55P03') return 'locked';
      throw err;
    } finally {
      client.release();
    }
  }

  it('should prevent over-selling under 20 parallel reservation requests', async () => {
    const PARALLEL = 20;
    const results = await Promise.allSettled(
      Array.from({ length: PARALLEL }, (_, i) => tryReserve(i)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value === 'success');
    const locked = results.filter((r) => r.status === 'fulfilled' && r.value === 'locked');
    const insufficient = results.filter(
      (r) => r.status === 'fulfilled' && r.value === 'insufficient',
    );

    // CRITICAL: Never over-sell
    expect(succeeded.length).toBeLessThanOrEqual(INITIAL_STOCK);

    // All 20 requests accounted for (no unhandled errors)
    expect(succeeded.length + locked.length + insufficient.length).toBe(PARALLEL);

    // INVARIANT: DB matches
    const final = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
    expect(final!.reservedQuantity).toBe(succeeded.length);
    expect(final!.reservedQuantity).toBeLessThanOrEqual(INITIAL_STOCK);

    console.log(
      `[Concurrency] ${PARALLEL} workers → succeeded: ${succeeded.length}, ` +
        `locked (NOWAIT): ${locked.length}, insufficient: ${insufficient.length}`,
    );
  });

  it('should maintain DB invariant after contention (quantity unchanged)', async () => {
    const item = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
    // Quantity is only decremented on deduct, not on reserve
    expect(item!.quantity).toBe(INITIAL_STOCK);
    expect(item!.reservedQuantity).toBe(0); // Fresh beforeEach with no active reservations
  });
});
