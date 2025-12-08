/**
 * JWT Payload Types
 * Types cho JWT token payload - dùng cho RBAC/ABAC hybrid
 */

/**
 * Access Token Payload
 * Chứa thông tin cần thiết cho authentication và authorization
 */
export interface JwtAccessPayload {
  /** Subject - User ID */
  sub: string;
  /** Token type - để phân biệt access/refresh */
  type: 'access';
  /** User roles - dùng cho RBAC (Role-Based Access Control) */
  roles: string[];
  /** Issued at - timestamp khi token được tạo */
  iat?: number;
  /** Expiration - timestamp khi token hết hạn */
  exp?: number;
}

/**
 * Refresh Token Payload
 */
export interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Request User Payload
 * Được trả về từ JwtAccessStrategy.validate() và gắn vào req.user
 */
export interface RequestUserPayload {
  /** User ID */
  userId: string;
  /** User email */
  email?: string;
  /** User roles - từ JWT payload (RBAC) */
  roles: string[];
  /** Permissions - có thể lazy load khi cần (ABAC) */
  permissions?: string[];
  /** Additional metadata */
  [key: string]: unknown;
}
