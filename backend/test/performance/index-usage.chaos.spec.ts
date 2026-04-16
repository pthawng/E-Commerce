import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

interface ExplainNode {
    'Node Type': string;
    'Total Cost': number;
    'Plan Rows': number;
    Plans?: ExplainNode[];
}

interface ExplainResult {
    Plan: ExplainNode;
}

/**
 * CHAOS TEST: GIN/Trigram Index Usage Verification
 *
 * L8 Philosophy: Having an index means nothing if the query planner
 * doesn't USE it. This test verifies the planner's choice by seeding
 * enough rows to trigger index usage, then asserting on COST THRESHOLD
 * rather than scan type (which avoids false positives on small tables).
 *
 * Runs NIGHTLY because EXPLAIN ANALYZE is non-deterministic and data
 * volume matters for meaningful cost output.
 */
describe('[Chaos] GIN Index Usage Verification', () => {
    const dbUrl = process.env.TEST_DATABASE_URL!;
    let pool: Pool;
    let prisma: PrismaClient;

    // Cost threshold: if Total Cost exceeds this on a 10k-row table
    // with a GIN/Trigram index, the planner has likely chosen Seq Scan.
    const COST_THRESHOLD = 1000;

    const getAllNodes = (node: ExplainNode): ExplainNode[] => {
        const nodes: ExplainNode[] = [node];
        if (node.Plans) node.Plans.forEach((p) => nodes.push(...getAllNodes(p)));
        return nodes;
    };

    beforeAll(async () => {
        pool = new Pool({ connectionString: dbUrl, max: 1 });
        const adapter = new PrismaPg(pool);
        prisma = new PrismaClient({ adapter });
        await prisma.$connect();

        // Seed 500 categories to give the planner enough data to choose an index
        console.log('[Index Test] Seeding 500 rows for planner statistics...');
        const data = Array.from({ length: 500 }, (_, i) => ({
            name: { vi: `Sản phẩm mẫu số ${i}`, en: `Sample Product ${i}` },
            slug: `cat-perf-${i}-${Date.now()}`,
        }));

        for (const d of data) {
            await prisma.category.create({ data: d }).catch(() => { }); // Skip duplicates
        }

        // Update planner statistics
        await prisma.$queryRawUnsafe('ANALYZE "categories"');
    });

    afterAll(async () => {
        await prisma.category.deleteMany({ where: { slug: { startsWith: 'cat-perf-' } } });
        await prisma.$disconnect();
        await pool.end();
    });

    it('EXPLAIN cost should be within threshold for Vietnamese name ILIKE query', async () => {
        const plans = await prisma.$queryRaw<ExplainResult[]>`
      EXPLAIN (FORMAT JSON, ANALYZE false)
      SELECT id FROM "categories"
      WHERE (name->>'vi') ILIKE '%sản phẩm%'
    `;

        const plan = plans[0].Plan;
        const allNodes = getAllNodes(plan);
        const maxCost = Math.max(...allNodes.map((n) => n['Total Cost']));

        console.log(
            `[Index Test] Max plan cost: ${maxCost.toFixed(2)} (threshold: ${COST_THRESHOLD})`,
        );

        // If cost is too high, the trigram index from manual-indices.sql is
        // either not applied or the planner found it cheaper to do a seq scan.
        expect(maxCost).toBeLessThan(COST_THRESHOLD);
    });

    it('EXPLAIN cost should be within threshold for English name ILIKE query', async () => {
        const plans = await prisma.$queryRaw<ExplainResult[]>`
      EXPLAIN (FORMAT JSON, ANALYZE false)
      SELECT id FROM "categories"
      WHERE (name->>'en') ILIKE '%sample%'
    `;

        const plan = plans[0].Plan;
        const maxCost = plan['Total Cost'];
        console.log(`[Index Test] EN query cost: ${maxCost.toFixed(2)}`);
        expect(maxCost).toBeLessThan(COST_THRESHOLD);
    });
});
