import type { User } from '@shared';

export function sanitizeUser(user: any): User {
  const roles = user.userRoles?.map((ur: any) => ur.role.slug) || [];

  // 1. Get base role permissions
  const effectivePermissions = new Set<string>(
    user.userRoles
      ?.flatMap((ur: any) => ur.role.rolePermissions?.map((rp: any) => rp.permission.action) || [])
      .filter(Boolean) || [],
  );

  // 2. Apply explicit user overrides
  const userOverrides = user.userPermissions || [];

  // Apply ALLOWs first
  userOverrides
    .filter((up: any) => up.effect === 'ALLOW')
    .forEach((up: any) => {
      if (up.permission.action) effectivePermissions.add(up.permission.action);
    });

  // Apply DENYs last (Strict precedence)
  userOverrides
    .filter((up: any) => up.effect === 'DENY')
    .forEach((up: any) => {
      if (up.permission.action) effectivePermissions.delete(up.permission.action);
    });

  const permissions = Array.from(effectivePermissions);

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    nickName: user.nickName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles,
    permissions,
  };
}
