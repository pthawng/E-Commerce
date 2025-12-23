import { Injectable } from '@nestjs/common';
import { BasePolicy } from 'src/modules/abac/base/base-policy';
import { PERMISSIONS } from 'src/modules/rbac/permissions.constants';
import {
  PolicyAction,
  type PolicyContext,
  type PolicyResult,
} from 'src/modules/abac/types/policy.types';

/**
 * Product Variant Resource Interface
 * Định nghĩa cấu trúc của variant resource cho ABAC
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
 * VariantPolicy - Hybrid RBAC/ABAC Policy
 * 
 * Chiến lược phân quyền:
 * 1. RBAC (Role-Based): Kiểm tra role và permission cơ bản
 * 2. ABAC (Attribute-Based): Kiểm tra attributes của user, resource, environment
 * 
 * Quy tắc phân quyền:
 * - Admin: Full access (tất cả actions)
 * - Staff/Manager: Có thể CREATE, READ, UPDATE (cần permission tương ứng)
 * - Inventory Manager: Có thể UPDATE stock-related fields
 * - Customer: Chỉ READ variants đang active
 * - Guest: Không có quyền truy cập
 */
@Injectable()
export class VariantPolicy extends BasePolicy<VariantResource> {
  async evaluate(context: PolicyContext<VariantResource>): Promise<PolicyResult> {
    const { user, action, resource } = context;

    // 1. Authentication check
    if (!user || !user.userId) {
      return this.deny('Unauthenticated - Vui lòng đăng nhập');
    }

    // 2. Admin bypass - Admin có full access
    if (this.hasRole(user, 'admin')) {
      return this.allow({ bypassReason: 'Admin full access' });
    }

    // 3. Check MANAGE permission - Nếu có MANAGE thì có full quyền
    if (this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.MANAGE)) {
      return this.allow({ bypassReason: 'Has MANAGE permission' });
    }

    // 4. Action-specific authorization
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
   * Kiểm tra quyền READ variant
   * - Customer: Chỉ xem variants đang active
   * - Staff/Manager: Xem tất cả variants
   */
  private evaluateRead(user: PolicyContext['user'], resource?: VariantResource): PolicyResult {
    // Check permission
    if (!this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.READ)) {
      return this.deny('Không có quyền xem variant');
    }

    // Customer chỉ xem variants active
    if (this.hasRole(user, 'customer')) {
      if (resource && resource.isActive === false) {
        return this.deny('Variant này không khả dụng');
      }
    }

    return this.allow();
  }

  /**
   * Kiểm tra quyền CREATE variant
   * - Chỉ staff, manager, hoặc có permission CREATE
   */
  private evaluateCreate(user: PolicyContext['user'], resource?: VariantResource): PolicyResult {
    // Check permission
    if (!this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.CREATE)) {
      return this.deny('Không có quyền tạo variant');
    }

    // Check role
    if (!this.hasAnyRole(user, ['staff', 'manager', 'product-manager'])) {
      return this.deny('Chỉ nhân viên mới có thể tạo variant');
    }

    // Business rule: Kiểm tra SKU không được trùng (nếu có resource)
    if (resource && !resource.sku) {
      return this.deny('SKU là bắt buộc khi tạo variant');
    }

    return this.allow();
  }

  /**
   * Kiểm tra quyền UPDATE variant
   * - Staff/Manager: Có thể update với permission
   * - Inventory Manager: Chỉ update stock-related fields
   */
  private evaluateUpdate(user: PolicyContext['user'], resource?: VariantResource): PolicyResult {
    // Check permission
    if (!this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.UPDATE)) {
      return this.deny('Không có quyền cập nhật variant');
    }

    // Check role
    if (!this.hasAnyRole(user, ['staff', 'manager', 'product-manager', 'inventory-manager'])) {
      return this.deny('Chỉ nhân viên mới có thể cập nhật variant');
    }

    // Special case: Inventory manager chỉ update stock
    if (this.hasRole(user, 'inventory-manager') && !this.hasAnyRole(user, ['staff', 'manager'])) {
      // Inventory manager có thể update nhưng với giới hạn
      // (Logic này có thể được mở rộng để kiểm tra fields cụ thể trong request body)
      return this.allow({
        metadata: {
          restrictedFields: ['stock', 'isActive'],
          warning: 'Inventory manager chỉ nên cập nhật stock-related fields'
        }
      });
    }

    return this.allow();
  }

  /**
   * Kiểm tra quyền DELETE variant
   * - Chỉ manager hoặc có permission DELETE
   * - Không cho phép xóa variant đã có orders (business rule)
   */
  private evaluateDelete(user: PolicyContext['user'], resource?: VariantResource): PolicyResult {
    // Check permission
    if (!this.hasPermission(user, PERMISSIONS.PRODUCT.VARIANT.DELETE)) {
      return this.deny('Không có quyền xóa variant');
    }

    // Check role - Chỉ manager trở lên
    if (!this.hasAnyRole(user, ['manager', 'product-manager'])) {
      return this.deny('Chỉ manager mới có thể xóa variant');
    }

    // Business rule: Có thể thêm kiểm tra variant có orders không
    // if (resource && resource.hasOrders) {
    //   return this.deny('Không thể xóa variant đã có đơn hàng');
    // }

    return this.allow();
  }
}
