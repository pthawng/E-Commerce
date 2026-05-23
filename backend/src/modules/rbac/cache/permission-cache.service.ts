import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionCacheService {
  private readonly logger = new Logger(PermissionCacheService.name);
  private readonly TTL = 1800 * 1000; // 30 minutes
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  /**
   * Retrieves permissions for a user using a cache-aside strategy.
   */
  async getPermissions(userId: string): Promise<string[]> {
    const key = `auth:permissions:${userId}`;

    // Check Redis cache
    try {
      const cached = await this.cacheManager.get<string[]>(key);
      if (cached) {
        return cached;
      }
    } catch (error) {
      this.logger.error('Redis error', error);
      // Do not throw error, fallback to database query
    }

    // Cache miss, retrieve permissions from database
    const permissions = await this.fetchPermissionsFromDb(userId);

    // Save to cache without awaiting to optimize response time
    this.cacheManager
      .set(key, permissions, this.TTL)
      .catch((e) => this.logger.error('Failed to set cache', e));

    return permissions;
  }

  /**
   * Clears the cached permissions for a user.
   */
  async clearCache(userId: string) {
    const key = `auth:permissions:${userId}`;
    await this.cacheManager.del(key);
    this.logger.log(`Cleared permission cache for user ${userId}`);
  }

  // Complex database query logic for fetching permissions
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

    // Populate permissions baseline from roles
    const rolePermissions = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        if (rp.permission.action) {
          rolePermissions.add(rp.permission.action);
        }
      });
    });

    // Resolve allowance and denial overrides
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

    // Calculate effective permissions
    const effectiveSet = new Set([...rolePermissions, ...allowOverrides]);
    for (const denied of denyOverrides) {
      effectiveSet.delete(denied);
    }

    return Array.from(effectiveSet);
  }
}
