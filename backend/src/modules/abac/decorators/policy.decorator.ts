/**
 * Policy Decorator
 * Decorator to attach policy checks to controller methods
 */

import { SetMetadata } from '@nestjs/common';
import type { BasePolicy } from '../base/base-policy';
import type { PolicyAction } from '../types/policy.types';

export const CHECK_POLICY_KEY = 'check_policy';

/**
 * Policy metadata
 */
export interface PolicyMetadata {
  /** Policy class */
  policy: new () => BasePolicy;
  /** Action to check */
  action: PolicyAction;
  /** Parameter name to extract resource ID from request */
  param?: string;
  /** Custom resource resolver function */
  resourceResolver?: (request: any) => Promise<unknown> | unknown;
}

/**
 * Check Policy Decorator
 *
 * @example
 * @CheckPolicy(OrderPolicy, PolicyAction.UPDATE, 'id')
 * @Patch(':id')
 * async updateOrder(@Param('id') id: string) {
 *   // Policy will check OrderPolicy.canUpdate()
 * }
 *
 * @example With custom resource resolver
 * @CheckPolicy(OrderPolicy, PolicyAction.READ, 'id', async (req) => {
 *   return await this.orderService.findOne(req.params.id);
 * })
 * @Get(':id')
 * async getOrder(@Param('id') id: string) {
 *   // Policy will check with custom resource
 * }
 */
export const CheckPolicy = (
  policy: new () => BasePolicy,
  action: PolicyAction,
  param?: string,
  resourceResolver?: (request: any) => Promise<unknown> | unknown,
) => {
  const metadata: PolicyMetadata = {
    policy,
    action,
    param,
    resourceResolver,
  };
  return SetMetadata(CHECK_POLICY_KEY, metadata);
};
