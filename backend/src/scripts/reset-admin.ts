import { PrismaClient, UserType } from '@prisma/client';
import * as argon2 from 'argon2';

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.RESET_ADMIN_EMAIL || 'admin@rayparadis.vn';
  const newPassword = process.env.RESET_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
  const shouldPrintPassword = process.argv.includes('--print-password');

  if (!newPassword) {
    throw new Error('RESET_ADMIN_PASSWORD or SEED_ADMIN_PASSWORD is required');
  }

  console.log(`Resetting password for: ${email}`);

  const hashedPassword = await argon2.hash(newPassword, ARGON_OPTIONS);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      userType: UserType.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
    create: {
      email,
      fullName: 'Ray Paradis Admin',
      passwordHash: hashedPassword,
      userType: UserType.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log(`Admin user ${user.email} has been reset/created.`);
  if (shouldPrintPassword) {
    console.log(`New password: ${newPassword}`);
  } else {
    console.log('Password was updated. Re-run with --print-password only in local dev if needed.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
