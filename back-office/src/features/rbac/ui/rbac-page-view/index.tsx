import { useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Form,
    Modal,
    Space,
    Tabs,
    message,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRbacRoles, useRbacPermissions } from '../../api/queries';
import {
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useCreatePermission,
    useUpdatePermission,
    useDeletePermission,
} from '../../api/mutations';
import type { RbacRole, RbacPermission } from '../../api/queries';
import { RoleList } from '../role-list';
import { RoleForm } from '../role-form';
import { PermissionList } from '../permission-list';
import { PermissionForm } from '../permission-form';

export function RbacPageView() {
    const [roleForm] = Form.useForm();
    const [permissionForm] = Form.useForm();
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RbacRole | null>(null);
    const [editingPermission, setEditingPermission] = useState<RbacPermission | null>(null);

    const {
        data: roles,
        isLoading: rolesLoading,
        error: rolesError,
        refetch: refetchRoles,
    } = useRbacRoles();

    const {
        data: permissions,
        isLoading: permsLoading,
        error: permsError,
        refetch: refetchPerms,
    } = useRbacPermissions();

    const createRole = useCreateRole();
    const updateRole = useUpdateRole();
    const deleteRole = useDeleteRole();
    const createPermission = useCreatePermission();
    const updatePermission = useUpdatePermission();
    const deletePermission = useDeletePermission();

    // Role Handlers
    const handleOpenCreateRole = () => {
        setEditingRole(null);
        roleForm.resetFields();
        setIsRoleModalOpen(true);
    };

    const handleOpenEditRole = (role: RbacRole) => {
        setEditingRole(role);
        setIsRoleModalOpen(true);
    };

    const handleSubmitRole = async () => {
        try {
            const values = await roleForm.validateFields();
            if (editingRole) {
                await updateRole.mutateAsync({
                    slug: editingRole.slug,
                    data: {
                        name: values.name,
                        description: values.description,
                    },
                });
                message.success('Cập nhật role thành công');
            } else {
                await createRole.mutateAsync({
                    slug: values.slug,
                    name: values.name,
                    description: values.description,
                    isSystem: values.isSystem,
                });
                message.success('Tạo role thành công');
            }
            setIsRoleModalOpen(false);
            setEditingRole(null);
            roleForm.resetFields();
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Lỗi khi lưu role');
        }
    };

    const handleDeleteRole = async (slug: string) => {
        try {
            await deleteRole.mutateAsync(slug);
            message.success('Đã xóa role');
        } catch {
            message.error('Xóa role thất bại');
        }
    };

    // Permission Handlers
    const handleOpenCreatePermission = () => {
        setEditingPermission(null);
        permissionForm.resetFields();
        setIsPermissionModalOpen(true);
    };

    const handleOpenEditPermission = (permission: RbacPermission) => {
        setEditingPermission(permission);
        setIsPermissionModalOpen(true);
    };

    const handleSubmitPermission = async () => {
        try {
            const values = await permissionForm.validateFields();
            if (editingPermission) {
                await updatePermission.mutateAsync({
                    slug: editingPermission.slug,
                    data: {
                        name: values.name,
                        description: values.description,
                        module: values.module,
                        action: values.action,
                    },
                });
                message.success('Cập nhật permission thành công');
            } else {
                await createPermission.mutateAsync({
                    slug: values.slug,
                    name: values.name,
                    description: values.description,
                    module: values.module,
                    action: values.action,
                });
                message.success('Tạo permission thành công');
            }
            setIsPermissionModalOpen(false);
            setEditingPermission(null);
            permissionForm.resetFields();
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Lỗi khi lưu permission');
        }
    };

    const handleDeletePermission = async (slug: string) => {
        try {
            await deletePermission.mutateAsync(slug);
            message.success('Đã xóa permission');
        } catch {
            message.error('Xóa permission thất bại');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 font-heading">RBAC Admin</h1>
                    <p className="text-slate-500">Quản lý roles và permissions, đồng bộ backend.</p>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => { refetchRoles(); refetchPerms(); }}>
                        Làm mới
                    </Button>
                </Space>
            </div>

            {rolesError || permsError ? (
                <Alert
                    type="error"
                    message="Không thể tải dữ liệu RBAC"
                    description={
                        rolesError
                            ? String(rolesError)
                            : permsError
                                ? String(permsError)
                                : 'Unknown error'
                    }
                    className="rounded-xl border-red-200 bg-red-50 text-red-800"
                />
            ) : null}

            <Tabs
                items={[
                    {
                        key: 'roles',
                        label: 'Roles',
                        children: (
                            <Card
                                className="shadow-sm rounded-xl border-slate-100"
                                title={<span className="font-heading">Roles</span>}
                                extra={
                                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateRole} className="bg-gradient-to-r from-amber-500 to-amber-600 border-none">
                                        Thêm role
                                    </Button>
                                }
                            >
                                <RoleList
                                    roles={roles || []}
                                    isLoading={rolesLoading}
                                    onEdit={handleOpenEditRole}
                                    onDelete={handleDeleteRole}
                                    isDeleting={deleteRole.isPending}
                                />
                            </Card>
                        ),
                    },
                    {
                        key: 'permissions',
                        label: 'Permissions',
                        children: (
                            <Card
                                className="shadow-sm rounded-xl border-slate-100"
                                title={<span className="font-heading">Permissions</span>}
                                extra={
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={handleOpenCreatePermission}
                                        className="bg-gradient-to-r from-amber-500 to-amber-600 border-none"
                                    >
                                        Thêm permission
                                    </Button>
                                }
                            >
                                <PermissionList
                                    permissions={permissions || []}
                                    isLoading={permsLoading}
                                    onEdit={handleOpenEditPermission}
                                    onDelete={handleDeletePermission}
                                    isDeleting={deletePermission.isPending}
                                />
                            </Card>
                        ),
                    },
                ]}
            />

            {/* Role Modal */}
            <Modal
                title={editingRole ? 'Chỉnh sửa role' : 'Tạo role'}
                open={isRoleModalOpen}
                onCancel={() => {
                    setIsRoleModalOpen(false);
                    setEditingRole(null);
                    roleForm.resetFields();
                }}
                onOk={handleSubmitRole}
                confirmLoading={createRole.isPending || updateRole.isPending}
                destroyOnHidden
            >
                <RoleForm
                    form={roleForm}
                    isEditing={!!editingRole}
                    initialValues={editingRole ? {
                        slug: editingRole.slug,
                        name: editingRole.name,
                        description: editingRole.description,
                        isSystem: editingRole.isSystem
                    } : {
                        isSystem: false
                    }}
                />
            </Modal>

            {/* Permission Modal */}
            <Modal
                title={editingPermission ? 'Chỉnh sửa permission' : 'Tạo permission'}
                open={isPermissionModalOpen}
                onCancel={() => {
                    setIsPermissionModalOpen(false);
                    setEditingPermission(null);
                    permissionForm.resetFields();
                }}
                onOk={handleSubmitPermission}
                confirmLoading={createPermission.isPending || updatePermission.isPending}
                destroyOnHidden
            >
                <PermissionForm
                    form={permissionForm}
                    isEditing={!!editingPermission}
                    initialValues={editingPermission ? {
                        slug: editingPermission.slug,
                        name: editingPermission.name,
                        description: editingPermission.description,
                        module: editingPermission.module,
                        action: editingPermission.action
                    } : undefined}
                />
            </Modal>
        </div>
    );
}
