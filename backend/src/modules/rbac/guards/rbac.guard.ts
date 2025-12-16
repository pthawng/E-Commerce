// src/auth/guards/permissions.guard.ts

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionCacheService } from '../cache/permission-cache.service';
import { PERMISSIONS_KEY, type PermissionMetadata } from '../decorators/permission.decorator';
import type { PermissionValue } from '../permissions.constants';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    // [CHANGE] Thay RbacService bằng PermissionCacheService để dùng Redis
    private permissionCacheService: PermissionCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Lấy Metadata từ Decorator (Giữ nguyên logic của bạn - rất tốt)
    const metadata = this.reflector.getAllAndOverride<PermissionMetadata | PermissionValue[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu API không yêu cầu quyền (không có decorator) -> Cho qua
    if (!metadata) return true;

    // Chuẩn hóa input (Array hoặc Object mode)
    const { permissions: requiredPermissions, mode } = Array.isArray(metadata)
      ? { permissions: metadata, mode: 'all' as const }
      : { permissions: metadata.permissions, mode: metadata.mode ?? 'all' };

    if (!requiredPermissions?.length) return true;

    // 2. Lấy User từ Request
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.userId) {
      throw new UnauthorizedException('User not found in request');
    }

    // [OPTIMIZATION 1] Super Admin Bypass
    // Nếu trong JWT Payload đã có flag isSystem hoặc role SUPER_ADMIN -> Cho qua luôn
    // Giúp Admin không bao giờ bị chặn và giảm tải check quyền
    if (user.roles?.includes('SUPER_ADMIN') || user.isSystem) return true;

    // [OPTIMIZATION 2] Bỏ check `ensureActiveUser` thừa thãi
    // Lý do: Nếu user bị khóa, ta sẽ xóa cache permissions của họ.
    // Khi Guard không thấy cache -> gọi Service -> Service sẽ check DB và ném lỗi nếu user inactive.

    // 3. Lấy Permissions từ Redis (cực nhanh) ⚡
    const userPermissions = await this.permissionCacheService.getPermissions(user.userId);

    // 4. So sánh Logic (Any / All)
    const hasAccess =
      mode === 'any'
        ? requiredPermissions.some((p) => userPermissions.includes(p))
        : requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }

    return true;
  }
}
