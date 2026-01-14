import { PERMISSIONS } from './permissions.constants';

export interface PermissionSeed {
    action: string;
    name: string;
    module: string;
}

export const PERMISSION_SEEDS: PermissionSeed[] = [
    // AUTH - ROLE
    { action: PERMISSIONS.AUTH.ROLE.CREATE, name: 'Tạo role', module: 'AUTH' },
    { action: PERMISSIONS.AUTH.ROLE.READ, name: 'Xem role', module: 'AUTH' },
    { action: PERMISSIONS.AUTH.ROLE.UPDATE, name: 'Cập nhật role', module: 'AUTH' },
    { action: PERMISSIONS.AUTH.ROLE.DELETE, name: 'Xóa role', module: 'AUTH' },

    // AUTH - USER
    { action: PERMISSIONS.AUTH.USER.CREATE, name: 'Tạo user', module: 'AUTH' },
    { action: PERMISSIONS.AUTH.USER.READ, name: 'Xem user', module: 'AUTH' },
    { action: PERMISSIONS.AUTH.USER.UPDATE, name: 'Cập nhật user', module: 'AUTH' },
    { action: PERMISSIONS.AUTH.USER.DELETE, name: 'Xóa user', module: 'AUTH' },
    { action: PERMISSIONS.AUTH.USER.ASSIGN_ROLE, name: 'Gán role cho user', module: 'AUTH' },
    { action: PERMISSIONS.AUTH.USER.ASSIGN_PERMISSION, name: 'Gán permission cho user', module: 'AUTH' },

    // PRODUCT - CATEGORY
    { action: PERMISSIONS.PRODUCT.CATEGORY.CREATE, name: 'Tạo danh mục', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.CATEGORY.READ, name: 'Xem danh mục', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.CATEGORY.UPDATE, name: 'Cập nhật danh mục', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.CATEGORY.DELETE, name: 'Xóa danh mục', module: 'PRODUCT' },

    // PRODUCT - ATTRIBUTE
    { action: PERMISSIONS.PRODUCT.ATTRIBUTE.CREATE, name: 'Tạo thuộc tính', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.ATTRIBUTE.READ, name: 'Xem thuộc tính', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.ATTRIBUTE.UPDATE, name: 'Cập nhật thuộc tính', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.ATTRIBUTE.DELETE, name: 'Xóa thuộc tính', module: 'PRODUCT' },

    // PRODUCT - VARIANT
    { action: PERMISSIONS.PRODUCT.VARIANT.CREATE, name: 'Tạo variant', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.VARIANT.READ, name: 'Xem variant', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.VARIANT.UPDATE, name: 'Cập nhật variant', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.VARIANT.DELETE, name: 'Xóa variant', module: 'PRODUCT' },
    { action: PERMISSIONS.PRODUCT.VARIANT.MANAGE, name: 'Quản lý variant', module: 'PRODUCT' },
];
