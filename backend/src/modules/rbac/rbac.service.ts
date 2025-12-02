import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  /** Lấy tất cả permission của user (role + user-specific) */
  async getUserPermissions(userId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    const permissionsFromRoles = rolePermissions
      .flatMap((ur) => ur.role.rolePermissions)
      .map((rp) => rp.permission.slug);

    const permissionsFromUser = userPermissions.map((up) => up.permission.slug);

    return [...new Set([...permissionsFromRoles, ...permissionsFromUser])];
  }

  /** Gán role cho user */
  async assignRoleToUser(userId: string, roleSlug: string, assignedBy?: string) {
    const role = await this.prisma.role.findUnique({ where: { slug: roleSlug } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id, assignedAt: new Date(), assignedBy },
    });
  }

  /** Gán permission trực tiếp cho user */
  async assignPermissionToUser(userId: string, permissionSlug: string, assignedBy?: string) {
    const permission = await this.prisma.permission.findUnique({ where: { slug: permissionSlug } });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: {},
      create: { userId, permissionId: permission.id, assignedAt: new Date(), assignedBy },
    });
  }

  /** Gán permission cho role */
  async assignPermissionToRole(roleSlug: string, permissionSlug: string, assignedBy?: string) {
    const role = await this.prisma.role.findUnique({ where: { slug: roleSlug } });
    const permission = await this.prisma.permission.findUnique({ where: { slug: permissionSlug } });
    if (!role || !permission) {
      throw new NotFoundException('Role or Permission not found');
    }

    return this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id, assignedAt: new Date(), assignedBy },
    });
  }
}
