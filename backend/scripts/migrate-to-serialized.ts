import { PrismaClient, ItemStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Starting Zero-Downtime Migration: Quantitative -> Serialized');

    // 1. Get all quantitative inventory items with quantity > 0
    const inventoryItems = await prisma.inventoryItem.findMany({
        where: { quantity: { gt: 0 } },
        include: { productVariant: true, warehouse: true },
    });

    console.log(`Found ${inventoryItems.length} inventory records to migrate.`);

    for (const item of inventoryItems) {
        console.log(`Migrating ${item.quantity} units of ${item.productVariant.sku}...`);

        await prisma.$transaction(async (tx) => {
            // Create individual PhysicalItems for each unit
            for (let i = 0; i < item.quantity; i++) {
                await tx.physicalItem.create({
                    data: {
                        productVariantId: item.productVariantId,
                        status: ItemStatus.AVAILABLE,
                        serialNumber: `${item.productVariant.sku}-${uuidv4().substring(0, 8).toUpperCase()}`,
                        metadata: { migration: 'initial_serialization', migratedAt: new Date() },
                    },
                });
            }

            // Sync reserved quantity if any
            for (let i = 0; i < item.reservedQuantity; i++) {
                // We'll mark the first N items as RESERVED
                const itemToReserve = await tx.physicalItem.findFirst({
                    where: { productVariantId: item.productVariantId, status: ItemStatus.AVAILABLE },
                });
                if (itemToReserve) {
                    await tx.physicalItem.update({
                        where: { id: itemToReserve.id },
                        data: { status: ItemStatus.RESERVED },
                    });
                }
            }
        });
    }

    console.log('✅ Migration completed successfully.');
}

migrate()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
