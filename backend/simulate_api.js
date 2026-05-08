const { PrismaClient } = require('@prisma/client');
const { OrderService } = require('./dist/modules/order/order.service'); // Giả sử đã build

async function main() {
  const prisma = new PrismaClient();
  // Giả lập cuộc gọi API Admin không có tham số lọc
  const where = {};
  const limit = 15;
  const page = 1;
  const skip = 0;

  try {
    const items = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.order.count({ where });
    const totalPages = Math.ceil(total / limit);

    console.log('--- ACTUAL API RESPONSE SIMULATION ---');
    console.log('Items returned:', items.length);
    console.log('Total reported by DB:', total);
    console.log('Total Pages calculated:', totalPages);
    console.log('--------------------------------------');

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
