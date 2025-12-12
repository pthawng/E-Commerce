import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, type PermissionMetadata } from '../decorators/permission.decorator';
import { RbacService } from '../rbac.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<PermissionMetadata | string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!metadata) return true;

    const { permissions: requiredPermissions, mode } = Array.isArray(metadata)
      ? { permissions: metadata, mode: 'all' }
      : { permissions: metadata.permissions, mode: metadata.mode ?? 'all' };

    if (!requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      throw new UnauthorizedException();
    }

    // Kiểm tra trạng thái user (khóa/xóa mềm)
    await this.rbacService.ensureActiveUser(user.userId);

    const allPermissions = await this.rbacService.getUserPermissions(user.userId);

    const hasAccess =
      mode === 'any'
        ? requiredPermissions.some((p) => allPermissions.includes(p))
        : requiredPermissions.every((p) => allPermissions.includes(p));

    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }

    return true;
  }
}
