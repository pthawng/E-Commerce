/**
 * Order Policy
 * Enterprise-level policy với comprehensive checks cho Order entity
 */

import { Injectable } from '@nestjs/common';
import { BasePolicy } from './base/base-policy';
import type { PolicyContext, PolicyResult } from './types/policy.types';
import { PolicyAction } from './types/policy.types';

interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

@Injectable()
export class OrderPolicy extends BasePolicy<Order> {
  /**
   * Main evaluate method - central logic cho tất cả actions
   */
  async evaluate(context: PolicyContext<Order>): Promise<PolicyResult> {
    const { user, resource: order, action } = context;

    // Admin có full access
    if (this.hasRole(user, 'admin')) {
      return this.allow({ reason: 'Admin has full access' });
    }

    // Route to specific action handlers
    switch (action) {
      case PolicyAction.READ:
        return this.handleRead(user, order);
      case PolicyAction.CREATE:
        return this.handleCreate(user, context);
      case PolicyAction.UPDATE:
        return this.handleUpdate(user, order, context);
      case PolicyAction.DELETE:
        return this.handleDelete(user, order);
      default:
        return this.deny(`Action ${action} is not supported`);
    }
  }

  /**
   * Read policy
   * - Admin: can read all
   * - Staff: can read all
   * - User: can read own orders
   */
  private handleRead(user: PolicyContext['user'], order: Order | undefined): PolicyResult {
    if (!order) {
      // List view - check if user can list orders
      if (this.hasAnyRole(user, ['admin', 'staff'])) {
        return this.allow();
      }
      // Users can only see their own orders (handled in service layer)
      return this.allow();
    }

    // Detail view - check ownership
    if (this.hasAnyRole(user, ['admin', 'staff'])) {
      return this.allow();
    }

    if (this.isOwner(user, order)) {
      return this.allow();
    }

    return this.deny('Bạn chỉ có thể xem đơn hàng của chính mình');
  }

  /**
   * Create policy
   * - Any authenticated user can create orders
   * - Additional checks: business hours, account status, etc.
   */
  private handleCreate(user: PolicyContext['user'], _context: PolicyContext<Order>): PolicyResult {
    // Check if user has permission
    if (!this.hasPermission(user, 'order.create')) {
      return this.deny('Bạn không có quyền tạo đơn hàng');
    }

    // Business hours check (example) - can be enabled if needed
    // if (!this.isBusinessHours(context.environment?.timestamp)) {
    //   return this.deny('Chỉ có thể tạo đơn hàng trong giờ làm việc (9h-18h)');
    // }

    // Check user account status (example)
    if (user.attributes?.accountStatus === 'suspended') {
      return this.deny('Tài khoản của bạn đã bị tạm khóa');
    }

    return this.allow();
  }

  /**
   * Update policy
   * - Admin: can update all
   * - Staff: can update non-completed orders
   * - User: can update own pending orders only
   */
  private handleUpdate(
    user: PolicyContext['user'],
    order: Order | undefined,
    _context: PolicyContext<Order>,
  ): PolicyResult {
    if (!order) {
      return this.deny('Order not found');
    }

    // Admin can update all
    if (this.hasRole(user, 'admin')) {
      return this.allow();
    }

    // Staff can update non-completed orders
    if (this.hasRole(user, 'staff')) {
      if (order.status === 'completed') {
        return this.deny('Không thể cập nhật đơn hàng đã hoàn thành');
      }
      return this.allow();
    }

    // User can only update own pending orders
    if (this.isOwner(user, order)) {
      if (order.status === 'pending' || order.status === 'processing') {
        return this.allow();
      }
      return this.deny('Chỉ có thể cập nhật đơn hàng đang chờ xử lý');
    }

    return this.deny('Bạn chỉ có thể cập nhật đơn hàng của chính mình');
  }

  /**
   * Delete policy
   * - Only admin can delete orders
   * - Soft delete recommended (set deletedAt)
   */
  private handleDelete(user: PolicyContext['user'], order: Order | undefined): PolicyResult {
    if (!order) {
      return this.deny('Order not found');
    }

    if (this.hasRole(user, 'admin')) {
      return this.allow();
    }

    return this.deny('Chỉ admin mới có quyền xóa đơn hàng');
  }
}
