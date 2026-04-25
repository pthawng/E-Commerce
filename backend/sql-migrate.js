const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const logFile = 'sql-migrate.log';
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    log('Starting atomic data migration...');

    const variants = [
        'DRAFT', 'PENDING_PAYMENT', 'CONFIRMED', 'MATERIAL_RESERVED',
        'IN_PRODUCTION', 'QC', 'READY_TO_SHIP', 'SHIPPED',
        'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED'
    ];

    for (const variant of variants) {
        try {
            const sql = `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'OrderStatusEnum' AND e.enumlabel = '${variant}') THEN
                ALTER TYPE "OrderStatusEnum" ADD VALUE '${variant}';
            END IF;
        END
        $$;
      `;
            await prisma.$executeRawUnsafe(sql);
            log(`Added variant: ${variant}`);
        } catch (err) {
            log(`Failed to add variant ${variant}: ` + err.message);
        }
    }

    const updates = [
        `UPDATE "Order" SET status = 'PENDING_PAYMENT' WHERE status::text = 'pending' OR status::text = 'pending_payment'`,
        `UPDATE "Order" SET status = 'CONFIRMED' WHERE status::text = 'confirmed'`,
        `UPDATE "Order" SET status = 'IN_PRODUCTION' WHERE status::text = 'processing'`,
        `UPDATE "Order" SET status = 'SHIPPED' WHERE status::text = 'shipping'`,
        `UPDATE "Order" SET status = 'DELIVERED' WHERE status::text = 'delivered'`,
        `UPDATE "Order" SET status = 'COMPLETED' WHERE status::text = 'completed'`,
        `UPDATE "Order" SET status = 'CANCELLED' WHERE status::text = 'cancelled'`,
        `UPDATE "Order" SET status = 'RETURNED' WHERE status::text = 'returned'`,
        `UPDATE "Order" SET status = 'REFUNDED' WHERE status::text = 'refunded'`
    ];

    for (const sql of updates) {
        try {
            await prisma.$executeRawUnsafe(sql);
            log(`Executed: ${sql.substring(0, 50)}...`);
        } catch (err) {
            log(`Failed update: ` + err.message);
        }
    }

    log('Migration completed!');
}

main()
    .catch(e => {
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
