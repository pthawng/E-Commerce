import type { User } from '@shared';
import { Exclude, Expose } from 'class-transformer';

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

  @Exclude()
  passwordHash?: string;
}
