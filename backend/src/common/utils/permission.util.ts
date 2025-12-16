// utils/permission.util.t
import { PERMISSIONS } from '../../modules/rbac/permissions.constants';

/**
 * Hàm đệ quy giúp làm phẳng object PERMISSIONS thành mảng các chuỗi
 * Input: { AUTH: { ROLE: { CREATE: '...' } } }
 * Output: ['auth.role.create', 'auth.role.read', ...]
 */
export function getPermissionList(obj: any = PERMISSIONS): string[] {
  let permissions: string[] = [];

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      permissions.push(obj[key]);
    } else if (typeof obj[key] === 'object') {
      permissions = permissions.concat(getPermissionList(obj[key]));
    }
  }

  return permissions;
}
