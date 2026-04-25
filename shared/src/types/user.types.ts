/**
 * User Types
 * Types cho User entity - dùng chung giữa BE và FE
 */

/**
 * Base User Type
 */
export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName?: string;
  nickName?: string;
  avatarUrl?: string;
  bio?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  roles?: string[];
  permissions?: string[];
}

/**
 * User Summary (cho list, không có thông tin nhạy cảm)
 */
export interface UserSummary {
  id: string;
  email: string;
  fullName?: string;
  isActive: boolean;
  isEmailVerified: boolean;
}

/**
 * User with Full Role/Permission Objects (Relational)
 */
export interface UserWithRelations extends User {
  userRoles?: any[]; // Prisma relation
  userPermissions?: any[]; // Prisma relation
}

/**
 * Role Type
 */
export interface Role {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

/**
 * Permission Type
 */
export interface Permission {
  id: string;
  slug: string;
  name: string;
  description?: string;
  module?: string;
  action?: string;
  createdAt: Date | string;
}

