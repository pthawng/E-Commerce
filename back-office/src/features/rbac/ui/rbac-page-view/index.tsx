import { useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Form,
    Modal,
    Space,
    Tabs,
    message,
    Checkbox,
    Input,
    Select,
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
    useAssignPermissionToRole,
    useRemovePermissionFromRole,
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
    const [permissionRole, setPermissionRole] = useState<RbacRole | null>(null);
    const [rolePermSearch, setRolePermSearch] = useState<string>();
    const [rolePermModule, setRolePermModule] = useState<string>();

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
    const assignPermissionToRole = useAssignPermissionToRole();
    const removePermissionFromRole = useRemovePermissionFromRole();

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

    const currentRolePermissionSlugs = useMemo(
        () =>
            (permissionRole?.rolePermissions || []).map((rp) => rp.permission.action) ?? [],
        [permissionRole],
    );

    const moduleOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    (permissions || [])
                        .map((p) => p.module || p.action.split('.')[0]?.toUpperCase() || 'OTHER'),
                ),
            ).map((m) => ({ label: m, value: m })),
        [permissions],
    );

    const filteredPermissionsByModule = useMemo(() => {
        const search = rolePermSearch?.toLowerCase() || '';
        const module = rolePermModule;
        const grouped: Record<string, RbacPermission[]> = {};

        (permissions || []).forEach((p) => {
            const moduleName = p.module || p.action.split('.')[0]?.toUpperCase() || 'OTHER';
            if (module && moduleName !== module) return;

            if (search) {
                const text = `${p.name} ${p.action}`.toLowerCase();
                if (!text.includes(search)) return;
            }

            if (!grouped[moduleName]) grouped[moduleName] = [];
            grouped[moduleName].push(p);
        });

        return grouped;
    }, [permissions, rolePermSearch, rolePermModule]);

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
                    slug: editingPermission.action,
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

    const handleDeletePermission = async (slugOrAction: string) => {
        try {
            await deletePermission.mutateAsync(slugOrAction);
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
                                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateRole} className="bg-linear-to-r from-amber-500 to-amber-600 border-none">
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
                                    onManagePermissions={setPermissionRole}
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
                                        className="bg-linear-to-r from-amber-500 to-amber-600 border-none"
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
                centered
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
                centered
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
                    initialValues={
                        editingPermission
                            ? {
                                name: editingPermission.name,
                                description: editingPermission.description,
                                module: editingPermission.module,
                                action: editingPermission.action,
                            }
                            : undefined
                    }
                />
            </Modal>

            {/* Role Permissions Modal */}
            <Modal
                title={permissionRole ? `Quyền mặc định cho role: ${permissionRole.name}` : ''}
                open={!!permissionRole}
                width={680}
                centered
                onCancel={() => {
                    setPermissionRole(null);
                    setRolePermSearch(undefined);
                    setRolePermModule(undefined);
                }}
                footer={
                    permissionRole && (
                        <Space className="w-full justify-end">
                            <Button
                                onClick={() => {
                                    setPermissionRole(null);
                                    setRolePermSearch(undefined);
                                    setRolePermModule(undefined);
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                loading={assignPermissionToRole.isPending || removePermissionFromRole.isPending}
                                onClick={async () => {
                                    if (!permissionRole) return;

                                    const form = document.querySelector('[data-permission-form]') as HTMLFormElement;
                                    if (!form) return;

                                    const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
                                    const selectedSlugs = Array.from(checkboxes).map(
                                        (cb) => (cb as HTMLInputElement).value
                                    );

                                    const prev = currentRolePermissionSlugs;
                                    const toAdd = selectedSlugs.filter((v) => !prev.includes(v));
                                    const toRemove = prev.filter((v) => !selectedSlugs.includes(v));

                                    try {
                                        await Promise.all([
                                            ...toAdd.map((slug) =>
                                                assignPermissionToRole.mutateAsync({
                                                    roleSlug: permissionRole.slug,
                                                    permissionSlug: slug,
                                                }),
                                            ),
                                            ...toRemove.map((slug) =>
                                                removePermissionFromRole.mutateAsync({
                                                    roleSlug: permissionRole.slug,
                                                    permissionSlug: slug,
                                                }),
                                            ),
                                        ]);
                                        message.success('Cập nhật quyền cho role thành công');
                                        setPermissionRole(null);
                                        setRolePermSearch(undefined);
                                        setRolePermModule(undefined);
                                    } catch {
                                        message.error('Không thể cập nhật quyền cho role');
                                    }
                                }}
                            >
                                Lưu
                            </Button>
                        </Space>
                    )
                }
                destroyOnClose
            >
                {permissionRole && (
                    <div className="space-y-4">
                        {/* Search & Filter */}
                        <Space align="center" wrap className="w-full">
                            <Input.Search
                                allowClear
                                placeholder="Tìm theo tên hoặc slug quyền..."
                                onSearch={(val) => setRolePermSearch(val || undefined)}
                                style={{ flex: 1, minWidth: 200 }}
                            />
                            <Select
                                allowClear
                                placeholder="Lọc theo module"
                                options={moduleOptions}
                                style={{ width: 180 }}
                                value={rolePermModule}
                                onChange={(val) => setRolePermModule(val)}
                            />
                        </Space>

                        {/* Permission List */}
                        <form data-permission-form>
                            <div className="border border-slate-200 rounded-md p-3 bg-slate-50/50">
                                <Checkbox.Group
                                    className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-2"
                                    defaultValue={currentRolePermissionSlugs}
                                >
                                    {Object.entries(filteredPermissionsByModule).map(
                                        ([moduleName, perms]) => (
                                            <div key={moduleName} className="space-y-2">
                                                <div className="text-xs font-bold text-slate-600 uppercase tracking-wide sticky top-0 bg-slate-50 py-1 z-10">
                                                    {moduleName}
                                                </div>
                                                <div className="flex flex-col gap-1.5 pl-3">
                                                    {perms.map((p) => (
                                                        <Checkbox key={p.id} value={p.action}>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm">{p.name}</span>
                                                                <span className="text-[11px] text-slate-400 font-mono">
                                                                    {p.action}
                                                                </span>
                                                            </div>
                                                        </Checkbox>
                                                    ))}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </Checkbox.Group>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
        </div>
    );
}
