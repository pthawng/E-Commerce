import { BasePolicy } from 'src/modules/abac/base/base-policy';
import { PolicyAction, type PolicyContext, type PolicyResult } from 'src/modules/abac/types/policy.types';

/**
 * VariantPolicy
 * - Ví dụ đơn giản: cho phép mọi user đã đăng nhập.
 * - Bạn có thể siết chặt theo role/permission sau (ví dụ: chỉ admin/staff mới CREATE/UPDATE/DELETE).
 */
export class VariantPolicy extends BasePolicy {
  async evaluate(context: PolicyContext): Promise<PolicyResult> {
    const { user, action } = context;

    if (!user || !user.userId) {
      return this.deny('Unauthenticated');
    }

    // Ví dụ ràng buộc quyền mạnh hơn: chỉ admin/staff mới viết
    const isWrite = [PolicyAction.CREATE, PolicyAction.UPDATE, PolicyAction.DELETE].includes(action);
    if (isWrite && !this.hasAnyRole(user, ['admin', 'staff'])) {
      return this.deny('Bạn không có quyền thao tác biến thể');
    }

    return this.allow();
  }
}

