const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const totalOrders = await prisma.order.count();
  const res = await prisma.order.groupBy({
    by: ['sessionId'],
  });
  const totalSessions = res.length;
  
  console.log({
    totalOrders,
    totalSessions,
    cr: totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
