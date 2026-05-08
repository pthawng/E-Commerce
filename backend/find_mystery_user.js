const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const heavyUsers = await prisma.order.groupBy({
      by: ['userId'],
      _count: { _all: true },
      having: {
        userId: { _count: { equals: 105 } }
      }
    });

    console.log('--- USERS WITH EXACTLY 105 ORDERS ---');
    for (const u of heavyUsers) {
      if (!u.userId) continue;
      const user = await prisma.user.findUnique({ where: { id: u.userId }, select: { fullName: true, email: true } });
      console.log(`Found: ${user.fullName} (${user.email}) - ID: ${u.userId}`);
    }
    
    // Nếu không thấy 105, thử tìm 100-110
    if (heavyUsers.length === 0) {
      console.log('No one has exactly 105. Searching range 100-110...');
      const rangeUsers = await prisma.order.groupBy({
        by: ['userId'],
        _count: { _all: true },
        having: {
          userId: { _count: { gte: 100, lte: 110 } }
        }
      });
      for (const u of rangeUsers) {
        if (!u.userId) continue;
        const user = await prisma.user.findUnique({ where: { id: u.userId }, select: { fullName: true, email: true } });
        console.log(`Found in range: ${user.fullName} (${user.email}) - Orders: ${u._count._all}`);
      }
    }
    console.log('-------------------------------------');

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
