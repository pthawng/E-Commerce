const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true }
    });

    const counts = statusCounts.map(s => ({ status: s.status, count: s._count._all }));
    
    console.log('--- SCANNING FOR COMBINATIONS TOTALING 105 ---');
    // Kiểm tra các tổ hợp đơn giản
    for(let i=0; i<counts.length; i++) {
      if(counts[i].count === 105) console.log(`FOUND: Status ${counts[i].status} has 105!`);
      for(let j=i+1; j<counts.length; j++) {
        if(counts[i].count + counts[j].count === 105) {
           console.log(`FOUND: ${counts[i].status} + ${counts[j].status} = 105!`);
        }
      }
    }
    console.log('--------------------------------------------');

    // Kiểm tra xem có bao nhiêu đơn hàng được tạo trong 1 tiếng qua
    const anHourAgo = new Date(Date.now() - 3600000);
    const recentOrders = await prisma.order.count({ where: { createdAt: { gte: anHourAgo } } });
    console.log('Orders in last hour:', recentOrders);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
