import type { User } from '@shared';
import { Exclude, Expose, Transform } from 'class-transformer';
/**
 * User Response DTO
 * Implements User interface from @shared/types
 * Used for API responses with class-transformer serialization
 */
export class UserResponseDto implements Omit<User, 'deletedAt'> {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  fullName?: string;

  @Expose()
  phone?: string;

  @Expose()
  isActive: boolean;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  lastLoginAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  deletedAt?: Date;

  @Expose()
  orderCount: number;

  @Expose()
  ltv: number;

  @Expose()
  @Transform(({ obj }) => obj.userRoles?.map((ur: any) => ur.role?.slug).filter(Boolean) || [])
  roles: string[];

  @Expose()
  @Transform(({ obj }) => {
    const direct = obj.userPermissions?.map((up: any) => up.permission?.action) || [];
    const fromRoles = obj.userRoles?.flatMap((ur: any) =>
      ur.role?.rolePermissions?.map((rp: any) => rp.permission?.action) || []
    ) || [];
    return Array.from(new Set([...direct, ...fromRoles])).filter(Boolean);
  })
  permissions: string[];

  @Exclude()
  passwordHash?: string;
}
