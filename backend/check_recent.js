const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { 
        code: true, 
        createdAt: true, 
        userId: true, 
        shippingAddress: true,
        user: { select: { fullName: true } }
      }
    });

    console.log('--- RECENT ORDERS ---');
    orders.forEach(o => {
      console.log(`Code: ${o.code} | Date: ${o.createdAt.toISOString()} | User: ${o.user?.fullName || 'Guest'} | ShippingName: ${o.shippingAddress?.fullName}`);
    });
    console.log('---------------------');

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
