const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const userOrderCounts = await prisma.order.groupBy({
      by: ['userId'],
      _count: { _all: true },
      having: {
        userId: { _count: { gt: 50 } }
      }
    });

    console.log('--- USERS WITH > 50 ORDERS ---');
    for (const u of userOrderCounts) {
      const user = await prisma.user.findUnique({ where: { id: u.userId }, select: { fullName: true, email: true } });
      console.log(`User: ${user.fullName} (${user.email}) - Total Orders: ${u._count._all}`);
    }
    console.log('------------------------------');

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
