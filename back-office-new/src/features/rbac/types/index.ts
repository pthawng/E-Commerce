// Use const instead of enum to satisfy `erasableSyntaxOnly: true`
export const PermissionModule = {
    AUTH: 'AUTH',
    PRODUCT: 'PRODUCT',
    ORDER: 'ORDER',
    DISCOUNT: 'DISCOUNT',
    CMS: 'CMS',
    SYSTEM: 'SYSTEM',
} as const;
export type PermissionModuleType = typeof PermissionModule[keyof typeof PermissionModule];

export interface Permission {
    id: string;
    name: string;
    description: string | null;
    module: PermissionModuleType | null;
    action: string | null;
    createdAt: string;
}

export interface CreatePermissionDTO {
    slug: string;
    name: string;
    description?: string;
    module?: PermissionModuleType;
}

export type UpdatePermissionDTO = Partial<CreatePermissionDTO>;

export interface Role {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
    permissions?: Permission[];
}

export interface CreateRoleDTO {
    name: string;
    slug: string;
    description?: string;
    permissionIds?: string[];
}

export interface UpdateRoleDTO extends Partial<CreateRoleDTO> { }
