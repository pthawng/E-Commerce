import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionCacheService {
  private readonly logger = new Logger(PermissionCacheService.name);
  private readonly TTL = 1800 * 1000; // 30 phút
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) { }

  /**
   * Lấy quyền của User (Ưu tiên Cache -> Fallback DB)
   * Chiến lược: Cache-Aside
   */
  async getPermissions(userId: string): Promise<string[]> {
    const key = `auth:permissions:${userId}`;

    // 1. Kiểm tra cache Redis
    try {
      const cached = await this.cacheManager.get<string[]>(key);
      if (cached) {
        // this.logger.debug(`Hit cache for user ${userId}`);
        return cached;
      }
    } catch (error) {
      this.logger.error('Redis error', error);
      // Không throw error, để nó chạy xuống query DB
    }

    // 2. Cache Miss -> Query DB (Logic gộp quyền Role + Permission lẻ)
    const permissions = await this.fetchPermissionsFromDb(userId);

    // 3. Save to Cache (Fire and forget - không cần await để tăng tốc response)
    this.cacheManager
      .set(key, permissions, this.TTL)
      .catch((e) => this.logger.error('Failed to set cache', e));

    return permissions;
  }

  /**
   * Xóa Cache khi có thay đổi (Invalidation)
   */
  async clearCache(userId: string) {
    const key = `auth:permissions:${userId}`;
    await this.cacheManager.del(key);
    this.logger.log(`Cleared permission cache for user ${userId}`);
  }

  // --- Private Helper: Logic Query DB phức tạp nằm ở đây ---
  private async fetchPermissionsFromDb(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
        userPermissions: { include: { permission: true } },
      },
    });

    if (!user) return [];

    // 1. Roles baseline
    const rolePermissions = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        if (rp.permission.action) {
          rolePermissions.add(rp.permission.action);
        }
      });
    });

    // 2. Resolve Overrides (ALLOW / DENY)
    const allowOverrides = user.userPermissions
      .filter((up) => up.effect === 'ALLOW')
      .map((up) => up.permission.action)
      .filter((a): a is string => Boolean(a));

    const denyOverrides = new Set(
      user.userPermissions
        .filter((up) => up.effect === 'DENY')
        .map((up) => up.permission.action)
        .filter((a): a is string => Boolean(a)),
    );

    // 3. Final Composite: (Roles + ALLOW) - DENY
    const effectiveSet = new Set([...rolePermissions, ...allowOverrides]);
    for (const denied of denyOverrides) {
      effectiveSet.delete(denied);
    }

    return Array.from(effectiveSet);
  }
}
