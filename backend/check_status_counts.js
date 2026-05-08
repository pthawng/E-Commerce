const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true }
    });

    console.log('--- ORDER STATUS DISTRIBUTION ---');
    statusCounts.forEach(s => {
      console.log(`Status: ${s.status} | Count: ${s._count._all}`);
    });
    console.log('---------------------------------');

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
