const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  // Giả lập logic của OrderService.findAllPaginated
  const limit = 15;
  const page = 1;
  const where = {}; // Admin view, không lọc theo userId

  try {
    const total = await prisma.order.count({ where });
    const totalPages = Math.ceil(total / limit);
    
    console.log('--- BACKEND LOGIC CHECK ---');
    console.log('Limit per page:', limit);
    console.log('Calculated Total:', total);
    console.log('Calculated Total Pages:', totalPages);
    console.log('---------------------------');

    if (total !== 2000) {
      console.log('WARNING: Count with empty where is NOT 2000. Something is filtering.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
