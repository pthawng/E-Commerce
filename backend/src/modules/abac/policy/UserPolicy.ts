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
        // Allow viewing own profile
        if (resource && this.isOwner(user, resource)) return this.allow();
        return this.deny('You can only view your own information');

      case PolicyAction.UPDATE:
        // Allow self-update or HR staff
        if (resource && this.isOwner(user, resource)) return this.allow();
        if (this.hasRole(user, 'hr')) return this.allow();
        return this.deny('Insufficient permissions to update the user');

      case PolicyAction.DELETE:
        return this.deny('Deleting users is not allowed');

      default:
        return this.deny(`Action ${action} is not supported`);
    }
  }
}
