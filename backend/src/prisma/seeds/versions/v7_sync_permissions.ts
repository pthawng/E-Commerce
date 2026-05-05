import { PrismaClient } from '@prisma/client';
import { PERMISSION_SEEDS } from '../../../modules/rbac/permissions.seed';
import { SeedScript } from '../utils/history';

export const v7_sync_permissions: SeedScript = {
  version: 'v7',
  name: 'Sync Missing Permissions to SUPER_ADMIN',
  run: async (prisma: PrismaClient) => {
    // 1. Upsert all permissions (adds new ones, updates existing)
    for (const p of PERMISSION_SEEDS) {
      await prisma.permission.upsert({
        where: { action: p.action },
        update: { name: p.name, module: p.module as any },
        create: {
          action: p.action,
          name: p.name,
          module: p.module as any,
        },
      });
    }

    // 2. Re-sync SUPER_ADMIN to have ALL permissions (including newly added ones)
    const superAdmin = await prisma.role.findUniqueOrThrow({
      where: { slug: 'SUPER_ADMIN' },
    });

    const allPermissions = await prisma.permission.findMany();

    // Delete and re-assign to ensure completeness
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdmin.id },
    });

    await prisma.rolePermission.createMany({
      data: allPermissions.map((p) => ({
        roleId: superAdmin.id,
        permissionId: p.id,
      })),
    });

    console.log(`✅ SUPER_ADMIN synced with ${allPermissions.length} permissions.`);
  },
};
