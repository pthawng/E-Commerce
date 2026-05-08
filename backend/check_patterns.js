const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const ordersToday = await prisma.order.count({
      where: { createdAt: { gte: today } }
    });
    
    console.log('Orders created today:', ordersToday);
    
    // Kiểm tra xem có bao nhiêu đơn hàng có mã bắt đầu bằng 'RP-'
    const rpOrders = await prisma.order.count({
      where: { code: { startsWith: 'RP-' } }
    });
    console.log('Orders with code RP-:', rpOrders);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
