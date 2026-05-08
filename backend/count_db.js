const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.order.count();
    console.log('--- DATABASE CHECK ---');
    console.log('Total Orders in DB:', count);
    console.log('----------------------');
  } catch (e) {
    console.error('Check failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
