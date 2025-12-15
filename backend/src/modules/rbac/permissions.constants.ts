/**
 * Centralized permission strings.
 *
 * Tư duy "Hybrid":
 * - DB / UI grouping: dùng enum/module (PermissionModule) để group theo module.
 * - Logic check quyền: luôn dựa vào chuỗi slug cụ thể (vd: 'product.category.create').
 *
 * PERMISSIONS ở đây là single source of truth cho toàn bộ slug.
 */
export const PERMISSIONS = {
  AUTH: {
    ROLE: {
      CREATE: 'auth.role.create',
      READ: 'auth.role.read',
      UPDATE: 'auth.role.update',
      DELETE: 'auth.role.delete',
    },
    USER: {
      CREATE: 'auth.user.create',
      READ: 'auth.user.read',
      UPDATE: 'auth.user.update',
      DELETE: 'auth.user.delete',
    },
  },

  RBAC: {
    MANAGE: 'rbac.manage',
  },

  PRODUCT: {
    CATEGORY: {
      CREATE: 'product.category.create',
      READ: 'product.category.read',
      UPDATE: 'product.category.update',
      DELETE: 'product.category.delete',
    },

    ATTRIBUTE: {
      CREATE: 'product.attribute.create',
      READ: 'product.attribute.read',
      UPDATE: 'product.attribute.update',
      DELETE: 'product.attribute.delete',
    },
  },
} as const;

// Đệ quy lấy tất cả value string bên trong PERMISSIONS
type NestedValues<T> = T extends string
  ? T
  : T extends object
    ? { [K in keyof T]: NestedValues<T[K]> }[keyof T]
    : never;

// Union type của tất cả slug hợp lệ (tự động, không cần sửa tay)
export type PermissionValue = NestedValues<typeof PERMISSIONS>;
