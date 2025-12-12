import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export type PermissionMode = 'all' | 'any';

export interface PermissionMetadata {
  permissions: string[];
  mode?: PermissionMode;
}

/**
 * Gắn permission yêu cầu cho route
 * Ví dụ:
 * - Yêu cầu đủ tất cả: @Permission('user.update', 'user.read')
 * - Yêu cầu một trong số: @Permission('user.update', 'user.read', { mode: 'any' })
 */
export const Permission = (...args: Array<string | PermissionMetadata>) => {
  const maybeOptions = args[args.length - 1];
  const hasOptions = typeof maybeOptions === 'object' && !Array.isArray(maybeOptions);
  const permissions = (hasOptions ? args.slice(0, -1) : args) as string[];
  const mode = hasOptions ? (maybeOptions as PermissionMetadata).mode : 'all';

  const metadata: PermissionMetadata = {
    permissions,
    mode: mode ?? 'all',
  };

  return SetMetadata(PERMISSIONS_KEY, metadata);
};
