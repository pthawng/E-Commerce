const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.category.updateMany({
    where: { slug: 'materials' },
    data: { isInternal: true }
  });
  console.log(`Updated ${result.count} category to internal.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
