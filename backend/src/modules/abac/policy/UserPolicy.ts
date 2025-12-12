import { Injectable } from '@nestjs/common';
import { BasePolicy } from '../base/base-policy';
import { PolicyAction, type PolicyContext, type PolicyResult } from '../types/policy.types';

@Injectable()
export class UserPolicy extends BasePolicy<any> {
  async evaluate(context: PolicyContext<any>): Promise<PolicyResult> {
    const { user, resource, action } = context;

    // Admin full access
    if (this.hasRole(user, 'admin')) return this.allow();

    switch (action) {
      case PolicyAction.READ:
        // Cho phép xem chính mình
        if (resource && this.isOwner(user, resource)) return this.allow();
        return this.deny('Chỉ được xem thông tin của bạn');

      case PolicyAction.UPDATE:
        // Cho phép tự cập nhật hoặc nhân viên HR
        if (resource && this.isOwner(user, resource)) return this.allow();
        if (this.hasRole(user, 'hr')) return this.allow();
        return this.deny('Không đủ quyền cập nhật user');

      case PolicyAction.DELETE:
        return this.deny('Không cho phép xóa user');

      default:
        return this.deny(`Action ${action} chưa hỗ trợ`);
    }
  }
}
