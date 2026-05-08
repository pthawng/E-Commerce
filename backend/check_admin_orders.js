const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    // Tìm các user có quyền admin
    const admins = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: { slug: 'admin' }
          }
        }
      },
      select: { id: true, fullName: true, email: true }
    });

    console.log('--- ADMINS FOUND ---');
    for (const admin of admins) {
      const orderCount = await prisma.order.count({ where: { userId: admin.id } });
      console.log(`Admin: ${admin.fullName} (${admin.email}) - Orders: ${orderCount}`);
    }
    console.log('--------------------');

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
