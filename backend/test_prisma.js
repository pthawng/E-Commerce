const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('$')));
console.log('CartItem exists:', !!prisma.cartItem);
console.log('InventoryItem exists:', !!prisma.inventoryItem);
process.exit(0);
