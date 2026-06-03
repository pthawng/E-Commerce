import { PrismaClient, UserType } from '@prisma/client';
import * as argon2 from 'argon2';
import { SeedScript } from '../utils/history';

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

export const v4_initial_admin: SeedScript = {
  version: 'v4',
  name: 'Initial Super Admin Allocation',
  run: async (prisma: PrismaClient) => {
    const ADMIN_EMAIL = 'admin@rayparadis.vn';
    const ADMIN_PASS = process.env.SEED_ADMIN_PASSWORD;

    if (!ADMIN_PASS) {
      throw new Error('❌ SEED_ADMIN_PASSWORD is not defined. Admin allocation failed.');
    }

    const hashedAdminPass = await argon2.hash(ADMIN_PASS, ARGON_OPTIONS);

    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'SUPER_ADMIN' } });

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

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: superAdminRole.id },
    });

    // Ensure Super Admin has a StaffProfile so they can log in to back-office
    await prisma.staffProfile.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        staffStatus: 'MFA_SETUP_REQUIRED',
        mfaEnabled: false,
        department: 'Management',
      },
    });
  },
};
