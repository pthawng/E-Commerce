import { PrismaClient } from '@prisma/client';
import { PERMISSION_SEEDS } from '../../../modules/rbac/permissions.seed';
import { SeedScript } from '../utils/history';

export const v6_crm_permissions: SeedScript = {
  version: 'v6',
  name: 'Add CRM Guest Registry Permissions',
  run: async (prisma: PrismaClient) => {
    // 1. Sync ALL Permissions (picks up new ones)
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

    // 2. Ensure SUPER_ADMIN and ADMIN roles have all current permissions
    const masterRoles = await prisma.role.findMany({
      where: { slug: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    });

    const allPermissions = await prisma.permission.findMany();

    for (const role of masterRoles) {
      // Surgical upsert for all permissions to the role
      for (const p of allPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: p.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: p.id,
          },
        });
      }
    }
  },
};
