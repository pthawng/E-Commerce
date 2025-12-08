/**
 * ABAC Policy Types
 * Types cho Attribute-Based Access Control system
 */

import type { RequestUserPayload } from '@common/types/jwt.types';

/**
 * Policy Context
 * Chứa tất cả attributes cần thiết để evaluate policy
 */
export interface PolicyContext<TResource = unknown> {
  /** User attributes - từ JWT và DB */
  user: RequestUserPayload & {
    /** User ID */
    userId: string;
    /** User email */
    email?: string;
    /** User roles - từ JWT (RBAC) */
    roles: string[];
    /** User permissions - lazy loaded từ DB (RBAC) */
    permissions?: string[];
    /** Additional user attributes */
    attributes?: Record<string, unknown>;
  };

  /** Resource attributes - entity đang được check */
  resource?: TResource;

  /** Action đang được thực hiện */
  action: PolicyAction;

  /** Environment attributes - time, location, IP, etc. */
  environment?: {
    /** Current timestamp */
    timestamp?: Date;
    /** IP address */
    ipAddress?: string;
    /** User agent */
    userAgent?: string;
    /** Location (if available) */
    location?: {
      country?: string;
      city?: string;
    };
    /** Additional environment data */
    [key: string]: unknown;
  };

  /** Request metadata */
  request?: {
    /** HTTP method */
    method?: string;
    /** Request path */
    path?: string;
    /** Query parameters */
    query?: Record<string, unknown>;
    /** Request body */
    body?: unknown;
  };
}

/**
 * Policy Actions
 */
export enum PolicyAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  /** Custom actions */
  APPROVE = 'approve',
  REJECT = 'reject',
  PUBLISH = 'publish',
  ARCHIVE = 'archive',
}

/**
 * Policy Result
 */
export interface PolicyResult {
  /** Whether access is allowed */
  allowed: boolean;
  /** Reason for denial (if not allowed) */
  reason?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Policy Evaluation Options
 */
export interface PolicyEvaluationOptions {
  /** Skip cache */
  skipCache?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
  /** Additional context */
  additionalContext?: Record<string, unknown>;
}

