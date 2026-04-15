import { PrismaClient } from '@prisma/client';
import { PERMISSION_SEEDS } from '../../../modules/rbac/permissions.seed';
import { SeedScript } from '../utils/history';

export const v1_rbac: SeedScript = {
  version: 'v1',
  name: 'Initial RBAC (Roles & Permissions)',
  run: async (prisma: PrismaClient) => {
    // 1. Sync Permissions
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

    // 2. Create Roles
    const roles = [
      { name: 'Super Admin', slug: 'SUPER_ADMIN', description: 'Full system access' },
      { name: 'Staff', slug: 'STAFF', description: 'Store & Inventory management' },
      { name: 'Customer', slug: 'CUSTOMER', description: 'Standard shopper' },
    ];

    const roleRecords: any[] = [];
    for (const r of roles) {
      const role = await prisma.role.upsert({
        where: { slug: r.slug },
        update: { name: r.name, description: r.description },
        create: {
          name: r.name,
          slug: r.slug,
          description: r.description,
          isSystem: true,
        },
      });
      roleRecords.push(role);
    }

    // 3. Map Permissions to SUPER_ADMIN (All)
    const superAdmin = roleRecords.find((r) => r.slug === 'SUPER_ADMIN')!;
    const allPermissions = await prisma.permission.findMany();

    // Use a more surgical approach than deleteMany if needed,
    // but for Super Admin we usually want exactly "everything".
    // We'll use a transactionally safe way (handled by the orchestrator transaction).
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdmin.id },
    });

    await prisma.rolePermission.createMany({
      data: allPermissions.map((p) => ({
        roleId: superAdmin.id,
        permissionId: p.id,
      })),
    });
  },
};
