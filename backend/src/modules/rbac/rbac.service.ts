import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionCacheService } from './cache/permission-cache.service';

/**
 * Role-Based Access Control (RBAC) service.
 * Manages roles, permissions, user assignments, and authorization checks.
 */
@Injectable()
export class RbacService implements OnModuleInit {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    private prisma: PrismaService,
    private permissionCacheService: PermissionCacheService,
  ) {}

  async onModuleInit() {
    this.logger.log('RbacService initialized. Seeding skip (handled by orchestrator).');
  }

  /**
   * Ensures the user exists and is currently active.
   */
  async ensureActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    const inactive = user.deletedAt || user.isActive === false;
    if (inactive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa');
    }

    return user;
  }

  /**
   * Hydrates user permissions with precedence.
   * Logic sequence: DENY override > ALLOW override > role assignments.
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const userSpecificOverrides = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    // Build base permission set from assigned roles
    const roleSlugs = new Set<string>(
      rolePermissions
        .flatMap((ur) => ur.role.rolePermissions)
        .map((rp) => rp.permission.action)
        .filter((slug): slug is string => Boolean(slug)),
    );

    // Resolve explicit user overrides
    const allowOverrides = userSpecificOverrides
      .filter((up) => up.effect === 'ALLOW')
      .map((up) => up.permission.action)
      .filter((a): a is string => !!a);

    const denyOverrides = new Set(
      userSpecificOverrides
        .filter((up) => up.effect === 'DENY')
        .map((up) => up.permission.action)
        .filter((a): a is string => !!a),
    );

    // Combine role and allowance overrides, then remove denied permissions
    const effectivePermissions = new Set([...roleSlugs, ...allowOverrides]);

    for (const denied of denyOverrides) {
      effectivePermissions.delete(denied);
    }

    return Array.from(effectivePermissions);
  }

  /**
   * Assigns a role to a user.
   */
  async assignRoleToUser(userId: string, roleSlug: string, assignedBy?: string) {
    await this.ensureActiveUser(userId);

    const role = await this.prisma.role.findUnique({ where: { slug: roleSlug } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const result = await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id, assignedAt: new Date(), assignedBy },
    });

    // Invalidate permission cache for the affected user
    this.permissionCacheService.clearCache(userId).catch(() => null);

    return result;
  }

  /**
   * Assigns a permission directly to a user.
   */
  async assignPermissionToUser(userId: string, permissionSlug: string, assignedBy?: string) {
    await this.ensureActiveUser(userId);

    const permission = await this.prisma.permission.findUnique({
      where: { action: permissionSlug },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const result = await this.prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: {},
      create: { userId, permissionId: permission.id, assignedAt: new Date(), assignedBy },
    });

    this.permissionCacheService.clearCache(userId).catch(() => null);

    return result;
  }

  /**
   * Assigns a permission to a role.
   */
  async assignPermissionToRole(roleSlug: string, permissionSlug: string, assignedBy?: string) {
    const role = await this.prisma.role.findUnique({ where: { slug: roleSlug } });
    const permission = await this.prisma.permission.findUnique({
      where: { action: permissionSlug },
    });
    if (!role || !permission) {
      throw new NotFoundException('Role or Permission not found');
    }

    const result = await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id, assignedAt: new Date(), assignedBy },
    });

    // Invalidate permission cache for all users with this role
    const usersWithRole = await this.prisma.userRole.findMany({
      where: { roleId: role.id },
      select: { userId: true },
    });
    await Promise.allSettled(
      usersWithRole.map((u) => this.permissionCacheService.clearCache(u.userId)),
    );

    return result;
  }

  /**
   * Retrieves all roles.
   */
  async findAllRoles() {
    return this.prisma.role.findMany({
      where: { deletedAt: null },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: {
          select: { userRoles: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves a role by its slug.
   */
  async findRoleBySlug(slug: string) {
    const role = await this.prisma.role.findUnique({
      where: { slug, deletedAt: null },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  /**
   * Creates a new role.
   */
  async createRole(data: { slug: string; name: string; description?: string; isSystem?: boolean }) {
    const existing = await this.prisma.role.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ForbiddenException(`Role với slug "${data.slug}" đã tồn tại`);
    }

    const existingName = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existingName) {
      throw new ForbiddenException(`Role với tên "${data.name}" đã tồn tại`);
    }

    return this.prisma.role.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        isSystem: data.isSystem ?? false,
      },
    });
  }

  /**
   * Updates an existing role by its slug.
   */
  async updateRole(slug: string, data: { name?: string; description?: string }) {
    const role = await this.findRoleBySlug(slug);

    if (role.isSystem) {
      throw new ForbiddenException('Không thể cập nhật role hệ thống');
    }

    if (data.name && data.name !== role.name) {
      const existingName = await this.prisma.role.findUnique({ where: { name: data.name } });
      if (existingName) {
        throw new ForbiddenException(`Role với tên "${data.name}" đã tồn tại`);
      }
    }

    return this.prisma.role.update({
      where: { slug },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  /**
   * Soft deletes a role by its slug.
   */
  async deleteRole(slug: string) {
    const role = await this.findRoleBySlug(slug);

    if (role.isSystem) {
      throw new ForbiddenException('Không thể xóa role hệ thống');
    }

    const userCount = await this.prisma.userRole.count({ where: { roleId: role.id } });
    if (userCount > 0) {
      throw new ForbiddenException(`Không thể xóa role đang được sử dụng bởi ${userCount} user(s)`);
    }

    return this.prisma.role.update({
      where: { slug },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Removes a role from a user.
   */
  async removeRoleFromUser(userId: string, roleSlug: string) {
    await this.ensureActiveUser(userId);

    const role = await this.prisma.role.findUnique({ where: { slug: roleSlug } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const result = await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId: role.id } },
    });

    this.permissionCacheService.clearCache(userId).catch(() => null);

    return result;
  }

  /**
   * Retrieves all roles assigned to a user.
   */
  async getUserRoles(userId: string) {
    await this.ensureActiveUser(userId);

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
      orderBy: { assignedAt: 'asc' },
    });

    return userRoles;
  }

  /**
   * Removes a permission directly from a user.
   */
  async removePermissionFromUser(userId: string, permissionSlug: string) {
    await this.ensureActiveUser(userId);

    const permission = await this.prisma.permission.findUnique({
      where: { action: permissionSlug },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const result = await this.prisma.userPermission.delete({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
    });

    this.permissionCacheService.clearCache(userId).catch(() => null);

    return result;
  }

  /**
   * Retrieves direct permission overrides assigned to a user.
   */
  async getUserPermissionAssignments(userId: string) {
    await this.ensureActiveUser(userId);

    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
      orderBy: { assignedAt: 'asc' },
    });

    return userPermissions;
  }

  /**
   * Removes a permission assignment from a role.
   */
  async removePermissionFromRole(roleSlug: string, permissionSlug: string) {
    const role = await this.prisma.role.findUnique({ where: { slug: roleSlug } });
    const permission = await this.prisma.permission.findUnique({
      where: { action: permissionSlug },
    });
    if (!role || !permission) {
      throw new NotFoundException('Role or Permission not found');
    }

    // Retrieve affected users, delete the mapping, and invalidate their caches
    const usersWithRole = await this.prisma.userRole.findMany({
      where: { roleId: role.id },
      select: { userId: true },
    });

    const result = await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    });

    await Promise.allSettled(
      usersWithRole.map((u) => this.permissionCacheService.clearCache(u.userId)),
    );

    return result;
  }

  /**
   * Retrieves all permissions.
   */
  async findAllPermissions() {
    return this.prisma.permission.findMany({
      include: {
        _count: {
          select: {
            roles: true,
            userPermissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves a permission by its action slug.
   */
  async findPermissionBySlug(slug: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { action: slug },
      include: {
        _count: {
          select: {
            roles: true,
            userPermissions: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  /**
   * Creates a new permission.
   */
  async createPermission(data: {
    slug: string;
    name: string;
    description?: string;
    module?: string;
    action?: string;
  }) {
    const existing = await this.prisma.permission.findUnique({ where: { action: data.slug } });
    if (existing) {
      throw new ForbiddenException(`Permission với slug "${data.slug}" đã tồn tại`);
    }

    return this.prisma.permission.create({
      data: {
        name: data.name,
        description: data.description,
        module: data.module as any,
        action: data.slug,
      },
    });
  }

  /**
   * Updates a permission by its action slug.
   */
  async updatePermission(
    slug: string,
    data: { name?: string; description?: string; module?: string; action?: string },
  ) {
    await this.findPermissionBySlug(slug);

    return this.prisma.permission.update({
      where: { action: slug },
      data: {
        name: data.name,
        description: data.description,
        module: data.module as any,
        action: data.action as any,
      },
    });
  }

  /**
   * Deletes a permission by its action slug.
   */
  async deletePermission(slug: string) {
    const permission = await this.findPermissionBySlug(slug);

    const roleCount = await this.prisma.rolePermission.count({
      where: { permissionId: permission.id },
    });
    const userCount = await this.prisma.userPermission.count({
      where: { permissionId: permission.id },
    });

    if (roleCount > 0 || userCount > 0) {
      throw new ForbiddenException(
        `Không thể xóa permission đang được sử dụng bởi ${roleCount} role(s) và ${userCount} user(s)`,
      );
    }

    return this.prisma.permission.delete({ where: { action: slug } });
  }

  // ==================== SEED DEFAULT PERMISSIONS ====================
  private async seedDefaultPermissions() {
    const { PERMISSION_SEEDS } = await import('./permissions.seed');

    const permissions = await Promise.all(
      PERMISSION_SEEDS.map((p) =>
        this.prisma.permission.upsert({
          where: { action: p.action },
          update: {
            name: p.name,
            module: p.module as any,
            action: p.action,
          },
          create: {
            name: p.name,
            module: p.module as any,
            action: p.action,
          },
        }),
      ),
    );

    // Auto-assign all permissions to the 'admin' and 'super_admin' roles
    const masterRoles = await Promise.all([
      this.prisma.role.upsert({
        where: { slug: 'SUPER_ADMIN' },
        update: {},
        create: {
          slug: 'SUPER_ADMIN',
          name: 'Super Administrator',
          description: 'Hệ thống tối cao - Toàn quyền điều khiển',
          isSystem: true,
        },
      }),
      this.prisma.role.upsert({
        where: { slug: 'ADMIN' },
        update: {},
        create: {
          slug: 'ADMIN',
          name: 'Administrator',
          description: 'Quản trị viên hệ thống',
          isSystem: true,
        },
      }),
    ]);

    for (const role of masterRoles) {
      if (role) {
        for (const p of permissions) {
          await this.prisma.rolePermission.upsert({
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
    }
  }
}
