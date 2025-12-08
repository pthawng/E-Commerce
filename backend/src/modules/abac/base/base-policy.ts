/**
 * Base Policy
 * Abstract base class cho tất cả policies
 * Support async operations và complex conditions
 */

import type { PolicyContext, PolicyResult } from '../types/policy.types';
import { PolicyAction } from '../types/policy.types';

/**
 * Base Policy Interface
 * Tất cả policies phải implement interface này
 */
export abstract class BasePolicy<TResource = unknown> {
  /**
   * Check if user can perform action on resource
   *
   * @param context - Policy context với user, resource, action, environment
   * @returns PolicyResult với allowed flag và optional reason
   */
  abstract evaluate(context: PolicyContext<TResource>): Promise<PolicyResult> | PolicyResult;

  /**
   * Convenience methods cho common actions
   * Có thể override trong subclasses nếu cần custom logic
   */

  /**
   * Check if user can read resource
   */
  async canRead(context: PolicyContext<TResource>): Promise<PolicyResult> {
    return this.evaluate({
      ...context,
      action: PolicyAction.READ,
    });
  }

  /**
   * Check if user can create resource
   */
  async canCreate(context: PolicyContext<TResource>): Promise<PolicyResult> {
    return this.evaluate({
      ...context,
      action: PolicyAction.CREATE,
    });
  }

  /**
   * Check if user can update resource
   */
  async canUpdate(context: PolicyContext<TResource>): Promise<PolicyResult> {
    return this.evaluate({
      ...context,
      action: PolicyAction.UPDATE,
    });
  }

  /**
   * Check if user can delete resource
   */
  async canDelete(context: PolicyContext<TResource>): Promise<PolicyResult> {
    return this.evaluate({
      ...context,
      action: PolicyAction.DELETE,
    });
  }

  /**
   * Helper methods cho common checks
   */

  /**
   * Check if user has role
   */
  protected hasRole(user: PolicyContext['user'], role: string): boolean {
    return user.roles.includes(role);
  }

  /**
   * Check if user has any of the roles
   */
  protected hasAnyRole(user: PolicyContext['user'], roles: string[]): boolean {
    return roles.some((role) => user.roles.includes(role));
  }

  /**
   * Check if user has all roles
   */
  protected hasAllRoles(user: PolicyContext['user'], roles: string[]): boolean {
    return roles.every((role) => user.roles.includes(role));
  }

  /**
   * Check if user has permission
   */
  protected hasPermission(user: PolicyContext['user'], permission: string): boolean {
    return user.permissions?.includes(permission) ?? false;
  }

  /**
   * Check if user has any of the permissions
   */
  protected hasAnyPermission(user: PolicyContext['user'], permissions: string[]): boolean {
    if (!user.permissions) return false;
    return permissions.some((permission) => user.permissions!.includes(permission));
  }

  /**
   * Check if user owns resource
   */
  protected isOwner(user: PolicyContext['user'], resource: { userId?: string }): boolean {
    return resource.userId === user.userId;
  }

  /**
   * Check if resource has attribute value
   */
  protected hasAttribute<T>(resource: T, key: keyof T, value: unknown): boolean {
    return resource?.[key] === value;
  }

  /**
   * Check if time is within business hours (example)
   */
  protected isBusinessHours(timestamp?: Date): boolean {
    const now = timestamp || new Date();
    const hour = now.getHours();
    return hour >= 9 && hour < 18; // 9 AM - 6 PM
  }

  /**
   * Create allowed result
   */
  protected allow(metadata?: Record<string, unknown>): PolicyResult {
    return { allowed: true, metadata };
  }

  /**
   * Create denied result
   */
  protected deny(reason: string, metadata?: Record<string, unknown>): PolicyResult {
    return { allowed: false, reason, metadata };
  }
}
