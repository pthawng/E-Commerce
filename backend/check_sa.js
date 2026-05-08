const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const superAdmins = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: { slug: 'SUPER_ADMIN' }
          }
        }
      },
      select: { id: true, fullName: true, email: true }
    });

    console.log('--- SUPER ADMINS ---');
    for (const sa of superAdmins) {
      const orderCount = await prisma.order.count({ where: { userId: sa.id } });
      console.log(`SA: ${sa.fullName} (${sa.email}) - Orders: ${orderCount}`);
    }

    const totalOrders = await prisma.order.count();
    console.log('Total Orders in DB:', totalOrders);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
