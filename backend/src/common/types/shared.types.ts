/**
 * Re-export shared types for backend convenience
 * This file helps with IDE autocomplete and type consistency
 */

export type {
  ApiError,
  // API Types
  ApiResponse,
  // Auth Types
  AuthResponse,
  AuthTokens,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  PaginatedResponse,
  PaginationMeta,
  PaginationQuery,
  Permission,
  // Enums
  PermissionAction,
  PermissionModule,
  RefreshTokenPayload,
  RegisterPayload,
  ResetPasswordPayload,
  Role,
  // User Types
  User,
  UserSummary,
  UserWithRoles,
  VerifyEmailPayload,
} from '@shared';
