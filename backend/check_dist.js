const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const total = await prisma.order.count();
    const guestOrders = await prisma.order.count({ where: { userId: null } });
    const userOrders = await prisma.order.count({ where: { userId: { not: null } } });
    
    console.log('Total Orders:', total);
    console.log('Guest Orders (No userId):', guestOrders);
    console.log('User Orders (Has userId):', userOrders);

    // Kiểm tra top 5 userId có nhiều đơn nhất
    const topUsers = await prisma.order.groupBy({
      by: ['userId'],
      _count: { _all: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 5
    });
    console.log('Top Users Order Distribution:', topUsers);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
