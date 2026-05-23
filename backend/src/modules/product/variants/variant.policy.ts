import { Injectable } from '@nestjs/common';
import { BasePolicy } from 'src/modules/abac/base/base-policy';
import {
  PolicyAction,
  type PolicyContext,
  type PolicyResult,
} from 'src/modules/abac/types/policy.types';
import { PERMISSIONS } from 'src/modules/rbac/permissions.constants';

/**
 * Product variant resource interface.
 */
interface VariantResource {
  id?: string;
  productId?: string;
  sku?: string;
  isActive?: boolean;
  stock?: number;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: unknown;
}

/**
 * Policy evaluating variant operations for hybrid RBAC/ABAC.
 */
@Injectable()
export class VariantPolicy extends BasePolicy<VariantResource> {
  async evaluate(context: PolicyContext<VariantResource>): Promise<PolicyResult> {
    const { user, action, resource } = context;

    if (!user || !user.userId) {
      return this.deny('Unauthenticated - Vui lòng đăng nhập');
    }

    // Bypass authorization for admin role
    if (this.hasRole(user, 'admin')) {
      return this.allow({ bypassReason: 'Admin full access' });
    }

    // Allow access if the user has global manage permissions
    if (this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.MANAGE)) {
      return this.allow({ bypassReason: 'Has MANAGE permission' });
    }

    switch (action) {
      case PolicyAction.READ:
        return this.evaluateRead(user, resource);

      case PolicyAction.CREATE:
        return this.evaluateCreate(user, resource);

      case PolicyAction.UPDATE:
        return this.evaluateUpdate(user, resource);

      case PolicyAction.DELETE:
        return this.evaluateDelete(user, resource);

      default:
        return this.deny(`Action '${action}' không được hỗ trợ`);
    }
  }

  /**
   * Evaluates authorization for reading a variant.
   */
  private evaluateRead(user: PolicyContext['user'], resource?: VariantResource): PolicyResult {
    if (!this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.READ)) {
      return this.deny('Không có quyền xem variant');
    }

    // Customers can only view active variants
    if (this.hasRole(user, 'customer')) {
      if (resource && resource.isActive === false) {
        return this.deny('Variant này không khả dụng');
      }
    }

    return this.allow();
  }

  /**
   * Evaluates authorization for creating a variant.
   */
  private evaluateCreate(user: PolicyContext['user'], resource?: VariantResource): PolicyResult {
    if (!this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.CREATE)) {
      return this.deny('Không có quyền tạo variant');
    }

    if (!this.hasAnyRole(user, ['staff', 'manager', 'product-manager'])) {
      return this.deny('Chỉ nhân viên mới có thể tạo variant');
    }

    // Enforce unique SKU validation
    if (resource && !resource.sku) {
      return this.deny('SKU là bắt buộc khi tạo variant');
    }

    return this.allow();
  }

  /**
   * Evaluates authorization for updating a variant.
   */
  private evaluateUpdate(user: PolicyContext['user'], resource?: VariantResource): PolicyResult {
    if (!this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.UPDATE)) {
      return this.deny('Không có quyền cập nhật variant');
    }

    if (!this.hasAnyRole(user, ['staff', 'manager', 'product-manager', 'inventory-manager'])) {
      return this.deny('Chỉ nhân viên mới có thể cập nhật variant');
    }

    // Restrict updates for inventory managers to stock-related fields
    if (this.hasRole(user, 'inventory-manager') && !this.hasAnyRole(user, ['staff', 'manager'])) {
      return this.allow({
        restrictedFields: ['stock', 'isActive'],
        warning: 'Inventory manager chỉ nên cập nhật stock-related fields',
      });
    }

    return this.allow();
  }

  /**
   * Evaluates authorization for deleting a variant.
   */
  private evaluateDelete(user: PolicyContext['user'], resource?: VariantResource): PolicyResult {
    if (!this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.DELETE)) {
      return this.deny('Không có quyền xóa variant');
    }

    if (!this.hasAnyRole(user, ['manager', 'product-manager'])) {
      return this.deny('Chỉ manager mới có thể xóa variant');
    }

    return this.allow();
  }
}
