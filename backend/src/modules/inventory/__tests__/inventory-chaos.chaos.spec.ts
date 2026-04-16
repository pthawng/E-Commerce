import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { IntegrationTestBase } from '../../../../test/utils/integration-test-base';

/**
 * CHAOS TEST: Inventory Concurrency with Network Jitter & Random Failures
 *
 * L8 Philosophy: This test lives in the NIGHTLY pipeline.
 * Uses raw pg connections (same as the integration test), but adds:
 * - Random jitter before acquiring the lock
 * - Forced 10% failure injection (simulates network timeout)
 *
 * The INVARIANT: stock must never go negative or exceed initial value.
 */
describe('[Chaos] Inventory Concurrency — Dirty Conditions', () => {
    const base = new IntegrationTestBase();
    let prisma: PrismaClient;
    let pool: Pool;

    let variantId: string;
    let warehouseId: string;
    let inventoryItemId: string;
    const INITIAL_STOCK = 10;
    const PARALLEL_WORKERS = 30;

    const jitter = () => new Promise((r) => setTimeout(r, Math.random() * 200));

    beforeAll(async () => {
        await base.setup();
        prisma = base.prisma;
        pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL!, max: 30 });

        const wh = await prisma.warehouse.create({
            data: { name: 'Chaos WH', code: `WH-CHAOS-${Date.now()}`, isActive: true },
        });
        warehouseId = wh.id;

        const cat = await prisma.category.create({
            data: { name: { vi: 'Chaos', en: 'Chaos' }, slug: `chaos-cat-${Date.now()}` },
        });

        const prod = await prisma.product.create({
            data: {
                name: { vi: 'Chaos', en: 'Chaos' },
                slug: `chaos-prod-${Date.now()}`,
                categories: { create: { category: { connect: { id: cat.id } } } },
            },
        });

        const variant = await prisma.productVariant.create({
            data: { productId: prod.id, sku: `SKU-CHAOS-${Date.now()}`, price: 200000 },
        });
        variantId = variant.id;

        const item = await prisma.inventoryItem.create({
            data: { productVariantId: variantId, warehouseId, quantity: INITIAL_STOCK, reservedQuantity: 0 },
        });
        inventoryItemId = item.id;
    });

    afterAll(async () => {
        await prisma.inventoryItem.deleteMany({ where: { productVariantId: variantId } });
        await prisma.productVariant.deleteMany({ where: { id: variantId } });
        await pool.end();
        await base.teardown();
    });

    async function tryReserveChaos(workerId: number): Promise<'success' | 'locked' | 'insufficient' | 'timeout'> {
        await jitter(); // Simulate network delay

        // Inject 10% failure (simulates worker crash before DB commit)
        if (workerId % 10 === 0) throw new Error(`[Chaos] Worker ${workerId} simulated timeout`);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const lockResult = await client.query(
                `SELECT "reservedQuantity", quantity FROM "InventoryItem" WHERE id = $1 FOR UPDATE NOWAIT`,
                [inventoryItemId],
            );

            const { quantity, reservedQuantity } = lockResult.rows[0];
            if (quantity - reservedQuantity < 1) {
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
            await client.query('ROLLBACK').catch(() => { });
            if (err.code === '55P03') return 'locked';
            throw err;
        } finally {
            client.release();
        }
    }

    it('INVARIANT: stock never goes negative under jitter and random failure injection', async () => {
        const results = await Promise.allSettled(
            Array.from({ length: PARALLEL_WORKERS }, (_, i) => tryReserveChaos(i)),
        );

        const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value === 'success').length;

        const final = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
        expect(final).not.toBeNull();

        // INVARIANT: reserved must never exceed stock
        expect(final!.reservedQuantity).toBeLessThanOrEqual(INITIAL_STOCK);
        expect(final!.reservedQuantity).toBe(succeeded);
        // quantity unchanged (only deduct modifies it)
        expect(final!.quantity).toBe(INITIAL_STOCK);

        console.log(
            `[Chaos] Workers: ${PARALLEL_WORKERS}, Reserved: ${final!.reservedQuantity}/${INITIAL_STOCK}, ` +
            `Succeeded: ${succeeded}`,
        );
    }, 30000);
});
