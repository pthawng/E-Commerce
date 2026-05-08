const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    // 1. Kiểm tra tổng đơn hàng (Không lọc)
    const totalAll = await prisma.order.count();
    
    // 2. Kiểm tra xem có điều kiện nào ra đúng 105 không?
    // Thử lọc theo đơn hàng có note, hoặc đơn hàng có guestEmail, hoặc một flag nào đó
    const totalWithUserId = await prisma.order.count({ where: { userId: { not: null } } });
    
    console.log('Total All:', totalAll);
    console.log('Total with UserId:', totalWithUserId);

    // Thử tìm xem có cụm trạng thái nào cộng lại bằng 105 không
    // (PENDING_PAYMENT + ...) 
    
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true }
    });
    
    console.log('Status Counts:', statusCounts);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
