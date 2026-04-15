import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const v = await prisma.productVariant.findFirst({ select: { id: true } });
    console.log(v?.id);
    await prisma.$disconnect();
}
main();
