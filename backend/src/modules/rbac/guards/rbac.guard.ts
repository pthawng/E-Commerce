import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) return false;

    // Lấy permission từ roles
    const rolePermissions = await this.prismaService.userRole.findMany({
      where: { userId: user.userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
    const permissionsFromRoles = rolePermissions
      .flatMap((ur) => ur.role.rolePermissions)
      .map((rp) => rp.permission.slug);

    // Lấy permission trực tiếp từ user
    const userPermissions = await this.prismaService.userPermission.findMany({
      where: { userId: user.userId },
      include: { permission: true },
    });
    const permissionsFromUser = userPermissions.map((up) => up.permission.slug);

    // Tổng hợp permission
    const allPermissions = [...new Set([...permissionsFromRoles, ...permissionsFromUser])];

    // Check route required permission
    return required.every((p) => allPermissions.includes(p));
  }
}
