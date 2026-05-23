import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionCacheService } from '../cache/permission-cache.service';
import { PERMISSIONS_KEY, PermissionMetadata } from '../decorators/permission.decorator';
import { PermissionValue } from '../permissions.constants';

/**
 * Guard that verifies user permissions for RBAC and ABAC.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    // Use PermissionCacheService instead of RbacService to enable Redis caching
    private permissionCacheService: PermissionCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Retrieve metadata from reflector
    const metadata = this.reflector.getAllAndOverride<PermissionMetadata | PermissionValue[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Allow access if no permissions are required
    if (!metadata) return true;

    // Normalize input format to support both array and object structures
    const { permissions: requiredPermissions, mode } = Array.isArray(metadata)
      ? { permissions: metadata, mode: 'all' as const }
      : { permissions: metadata.permissions, mode: metadata.mode ?? 'all' };

    if (!requiredPermissions?.length) return true;

    // Retrieve user context from request
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.userId) {
      throw new UnauthorizedException('User not found in request');
    }

    // Bypass checks for system/internal operations
    if (user.isSystem) return true;

    // User status is checked during cache misses, avoiding redundant active checks

    // Retrieve permissions from cache
    const userPermissions = await this.permissionCacheService.getPermissions(user.userId);

    // Verify permissions based on required logic mode
    const hasAccess =
      mode === 'any'
        ? requiredPermissions.some((p) => userPermissions.includes(p))
        : requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
