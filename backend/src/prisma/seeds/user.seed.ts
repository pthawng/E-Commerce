import { PrismaClient, UserType } from '@prisma/client';
import * as argon2 from 'argon2';

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

export async function seedUsers(prisma: PrismaClient) {
  console.log('🚀 Seeding Users...');

  const ADMIN_EMAIL = 'admin@rayparadis.vn';
  const ADMIN_PASS = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const hashedAdminPass = await argon2.hash(ADMIN_PASS, ARGON_OPTIONS);

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'SUPER_ADMIN' } });

  // 1. Create/Update Super Admin
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { 
      fullName: 'Ray Paradis Admin', 
      passwordHash: hashedAdminPass,
      userType: UserType.SUPER_ADMIN,
    },
    create: {
      email: ADMIN_EMAIL,
      fullName: 'Ray Paradis Admin',
      passwordHash: hashedAdminPass,
      userType: UserType.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });

  // Assign role if not exists
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdminRole.id },
  });

  console.log(`✅ Synced Super Admin: ${ADMIN_EMAIL}`);

  // 2. Sample Customers (only in dev mode)
  if (process.env.SEED_MODE === 'dev') {
    const customerPass = await argon2.hash('Customer@123', ARGON_OPTIONS);
    const customers = [
      { email: 'demo@customer.vn', fullName: 'Đỗ Tiến Hoàng', type: UserType.CUSTOMER },
      { email: 'hoang@rayparadis.vn', fullName: 'PTHawng Demo', type: UserType.CUSTOMER },
    ];

    for (const c of customers) {
      const user = await prisma.user.upsert({
        where: { email: c.email },
        update: { fullName: c.fullName },
        create: {
          email: c.email,
          fullName: c.fullName,
          passwordHash: customerPass,
          userType: c.type,
          isEmailVerified: true,
          isActive: true,
        },
      });
      console.log(`✅ Synced Demo Customer: ${c.email}`);
    }
  }
}
