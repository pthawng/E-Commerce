import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PERMISSIONS } from './permissions.constants';

@Injectable()
export class RbacService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedProductPermissions();
  }

  /** Đảm bảo user tồn tại và đang hoạt động */
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
      .map((rp) => rp.permission.action)
      .filter((slug): slug is string => Boolean(slug));

    const permissionsFromUser = userPermissions
      .map((up) => up.permission.action)
      .filter((slug): slug is string => Boolean(slug));

    return [...new Set([...permissionsFromRoles, ...permissionsFromUser])];
  }

  /** Gán role cho user */
  async assignRoleToUser(userId: string, roleSlug: string, assignedBy?: string) {
    await this.ensureActiveUser(userId);

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
    await this.ensureActiveUser(userId);

    const permission = await this.prisma.permission.findUnique({
      where: { action: permissionSlug },
    });
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
    const permission = await this.prisma.permission.findUnique({
      where: { action: permissionSlug },
    });
    if (!role || !permission) {
      throw new NotFoundException('Role or Permission not found');
    }

    return this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id, assignedAt: new Date(), assignedBy },
    });
  }

  // ==================== ROLE CRUD ====================

  /** Lấy danh sách tất cả roles */
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

  /** Lấy role theo slug */
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

  /** Tạo mới role */
  async createRole(data: { slug: string; name: string; description?: string; isSystem?: boolean }) {
    // Kiểm tra slug đã tồn tại chưa
    const existing = await this.prisma.role.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ForbiddenException(`Role với slug "${data.slug}" đã tồn tại`);
    }

    // Kiểm tra name đã tồn tại chưa
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

  /** Cập nhật role */
  async updateRole(slug: string, data: { name?: string; description?: string }) {
    const role = await this.findRoleBySlug(slug);

    // Không cho phép cập nhật role hệ thống
    if (role.isSystem) {
      throw new ForbiddenException('Không thể cập nhật role hệ thống');
    }

    // Kiểm tra name mới có trùng không (nếu có thay đổi)
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

  /** Xóa role (soft delete) */
  async deleteRole(slug: string) {
    const role = await this.findRoleBySlug(slug);

    // Không cho phép xóa role hệ thống
    if (role.isSystem) {
      throw new ForbiddenException('Không thể xóa role hệ thống');
    }

    // Kiểm tra role có đang được sử dụng không
    const userCount = await this.prisma.userRole.count({ where: { roleId: role.id } });
    if (userCount > 0) {
      throw new ForbiddenException(`Không thể xóa role đang được sử dụng bởi ${userCount} user(s)`);
    }

    return this.prisma.role.update({
      where: { slug },
      data: { deletedAt: new Date() },
    });
  }

  /** Gỡ role khỏi user */
  async removeRoleFromUser(userId: string, roleSlug: string) {
    await this.ensureActiveUser(userId);

    const role = await this.prisma.role.findUnique({ where: { slug: roleSlug } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
  }

  /** Gỡ permission khỏi user */
  async removePermissionFromUser(userId: string, permissionSlug: string) {
    await this.ensureActiveUser(userId);

    const permission = await this.prisma.permission.findUnique({
      where: { action: permissionSlug },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.prisma.userPermission.delete({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
    });
  }

  /** Gỡ permission khỏi role */
  async removePermissionFromRole(roleSlug: string, permissionSlug: string) {
    const role = await this.prisma.role.findUnique({ where: { slug: roleSlug } });
    const permission = await this.prisma.permission.findUnique({
      where: { action: permissionSlug },
    });
    if (!role || !permission) {
      throw new NotFoundException('Role or Permission not found');
    }

    return this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
    });
  }

  // ==================== PERMISSION CRUD ====================

  /** Lấy danh sách tất cả permissions */
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

  /** Lấy permission theo slug (slug được lưu ở cột `action`) */
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

  /** Tạo mới permission */
  async createPermission(data: {
    slug: string;
    name: string;
    description?: string;
    module?: string;
    action?: string;
  }) {
    // Kiểm tra slug (được map vào cột action) đã tồn tại chưa
    const existing = await this.prisma.permission.findUnique({ where: { action: data.slug } });
    if (existing) {
      throw new ForbiddenException(`Permission với slug "${data.slug}" đã tồn tại`);
    }

    return this.prisma.permission.create({
      data: {
        name: data.name,
        description: data.description,
        module: data.module as any,
        // Lưu business slug (vd: "product.category.create") vào cột `action`
        action: data.slug,
      },
    });
  }

  /** Cập nhật permission */
  async updatePermission(
    slug: string,
    data: { name?: string; description?: string; module?: string; action?: string },
  ) {
    await this.findPermissionBySlug(slug);

    return this.prisma.permission.update({
      // slug map vào cột action
      where: { action: slug },
      data: {
        name: data.name,
        description: data.description,
        module: data.module as any,
        action: data.action as any,
      },
    });
  }

  /** Xóa permission */
  async deletePermission(slug: string) {
    const permission = await this.findPermissionBySlug(slug);

    // Kiểm tra permission có đang được sử dụng không
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

    // slug map vào cột action
    return this.prisma.permission.delete({ where: { action: slug } });
  }

  // ==================== SEED DEFAULT PERMISSIONS ====================
  private async seedProductPermissions() {
    const seeds = [
      // Category
      {
        action: PERMISSIONS.PRODUCT.CATEGORY.CREATE,
        name: 'Tạo danh mục',
        module: 'product',
      },
      {
        action: PERMISSIONS.PRODUCT.CATEGORY.READ,
        name: 'Xem danh mục',
        module: 'product',
      },
      {
        action: PERMISSIONS.PRODUCT.CATEGORY.UPDATE,
        name: 'Cập nhật danh mục',
        module: 'product',
      },
      {
        action: PERMISSIONS.PRODUCT.CATEGORY.DELETE,
        name: 'Xóa danh mục',
        module: 'product',
      },
      // Attribute
      {
        action: PERMISSIONS.PRODUCT.ATTRIBUTE.CREATE,
        name: 'Tạo thuộc tính',
        module: 'product',
      },
      {
        action: PERMISSIONS.PRODUCT.ATTRIBUTE.READ,
        name: 'Xem thuộc tính',
        module: 'product',
      },
      {
        action: PERMISSIONS.PRODUCT.ATTRIBUTE.UPDATE,
        name: 'Cập nhật thuộc tính',
        module: 'product',
      },
      {
        action: PERMISSIONS.PRODUCT.ATTRIBUTE.DELETE,
        name: 'Xóa thuộc tính',
        module: 'product',
      },
    ];

    await Promise.all(
      seeds.map((p) =>
        this.prisma.permission.upsert({
          // business slug (vd: "product.category.create") lưu ở cột action
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
  }
}
