import { useMemo, useState } from 'react';
import {
    Alert,
    Button,
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
import { useRbacRoles, useRbacPermissions } from '../../services/queries';
import {
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useCreatePermission,
    useUpdatePermission,
    useDeletePermission,
    useAssignPermissionToRole,
    useRemovePermissionFromRole,
} from '../../services/mutations';
import type { RbacRole, RbacPermission } from '../../services/queries';
import { RoleList } from '../role-list';
import { RoleForm } from '../role-form';
import { PermissionList } from '../permission-list';
import { PermissionForm } from '../permission-form';
import { PageHeader } from '@/shared/ui';
import * as tokens from '@/ui/design-tokens';
import { cardStyle, contentContainerStyle } from '@/ui/styles';

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
                message.success('Role updated successfully');
            } else {
                await createRole.mutateAsync({
                    slug: values.slug,
                    name: values.name,
                    description: values.description,
                    isSystem: values.isSystem,
                });
                message.success('Role created successfully');
            }
            setIsRoleModalOpen(false);
            setEditingRole(null);
            roleForm.resetFields();
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Error saving role');
        }
    };

    const handleDeleteRole = async (slug: string) => {
        try {
            await deleteRole.mutateAsync(slug);
            message.success('Role deleted');
        } catch {
            message.error('Failed to delete role');
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
                message.success('Permission updated successfully');
            } else {
                await createPermission.mutateAsync({
                    slug: values.slug,
                    name: values.name,
                    description: values.description,
                    module: values.module,
                    action: values.action,
                });
                message.success('Permission created successfully');
            }
            setIsPermissionModalOpen(false);
            setEditingPermission(null);
            permissionForm.resetFields();
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Error saving permission');
        }
    };

    const handleDeletePermission = async (slugOrAction: string) => {
        try {
            await deletePermission.mutateAsync(slugOrAction);
            message.success('Permission deleted');
        } catch {
            message.error('Failed to delete permission');
        }
    };

    return (
        <div>
            <PageHeader
                title="RBAC Administration"
                subtitle="Manage roles and system permissions"
                actions={
                    <Button icon={<ReloadOutlined />} onClick={() => { refetchRoles(); refetchPerms(); }}>
                        Refresh
                    </Button>
                }
            />

            {(rolesError || permsError) && (
                <div style={{ padding: `0 ${tokens.spacing.xxl}px`, marginBottom: tokens.spacing.lg }}>
                    <Alert
                        type="error"
                        message="Error Loading Data"
                        description={
                            rolesError
                                ? String(rolesError)
                                : permsError
                                    ? String(permsError)
                                    : 'Unknown error'
                        }
                        showIcon
                    />
                </div>
            )}

            <div style={contentContainerStyle}>
                <Tabs
                    items={[
                        {
                            key: 'roles',
                            label: 'Roles',
                            children: (
                                <div style={cardStyle}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: tokens.spacing.lg,
                                        paddingBottom: tokens.spacing.md,
                                        borderBottom: `1px solid ${tokens.neutral.borderLight}`
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: tokens.typography.fontSize.lg }}>System Roles</h3>
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateRole}>
                                            Add Role
                                        </Button>
                                    </div>
                                    <RoleList
                                        roles={roles || []}
                                        isLoading={rolesLoading}
                                        onEdit={handleOpenEditRole}
                                        onDelete={handleDeleteRole}
                                        isDeleting={deleteRole.isPending}
                                        onManagePermissions={setPermissionRole}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: 'permissions',
                            label: 'Permissions',
                            children: (
                                <div style={cardStyle}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: tokens.spacing.lg,
                                        paddingBottom: tokens.spacing.md,
                                        borderBottom: `1px solid ${tokens.neutral.borderLight}`
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: tokens.typography.fontSize.lg }}>System Permissions</h3>
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreatePermission}>
                                            Add Permission
                                        </Button>
                                    </div>
                                    <PermissionList
                                        permissions={permissions || []}
                                        isLoading={permsLoading}
                                        onEdit={handleOpenEditPermission}
                                        onDelete={handleDeletePermission}
                                        isDeleting={deletePermission.isPending}
                                    />
                                </div>
                            ),
                        },
                    ]}
                />
            </div>

            {/* Role Modal */}
            <Modal
                title={editingRole ? 'Edit Role' : 'Create Role'}
                open={isRoleModalOpen}
                centered
                onCancel={() => {
                    setIsRoleModalOpen(false);
                    setEditingRole(null);
                    roleForm.resetFields();
                }}
                onOk={handleSubmitRole}
                confirmLoading={createRole.isPending || updateRole.isPending}
                destroyOnClose
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
                title={editingPermission ? 'Edit Permission' : 'Create Permission'}
                open={isPermissionModalOpen}
                centered
                onCancel={() => {
                    setIsPermissionModalOpen(false);
                    setEditingPermission(null);
                    permissionForm.resetFields();
                }}
                onOk={handleSubmitPermission}
                confirmLoading={createPermission.isPending || updatePermission.isPending}
                destroyOnClose
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
                title={permissionRole ? `Manage Permissions: ${permissionRole.name}` : ''}
                open={!!permissionRole}
                width={800}
                centered
                onCancel={() => {
                    setPermissionRole(null);
                    setRolePermSearch(undefined);
                    setRolePermModule(undefined);
                }}
                footer={
                    permissionRole && (
                        <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                            <Button
                                onClick={() => {
                                    setPermissionRole(null);
                                    setRolePermSearch(undefined);
                                    setRolePermModule(undefined);
                                }}
                            >
                                Cancel
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
                                                    roleId: permissionRole.id,
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
                                        message.success('Role permissions updated');
                                        setPermissionRole(null);
                                        setRolePermSearch(undefined);
                                        setRolePermModule(undefined);
                                    } catch {
                                        message.error('Failed to update role permissions');
                                    }
                                }}
                            >
                                Save Changes
                            </Button>
                        </Space>
                    )
                }
                destroyOnClose
            >
                {permissionRole && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                        {/* Search & Filter */}
                        <div style={{ display: 'flex', gap: tokens.spacing.md }}>
                            <Input.Search
                                allowClear
                                placeholder="Search permissions..."
                                onSearch={(val) => setRolePermSearch(val || undefined)}
                                style={{ flex: 1 }}
                            />
                            <Select
                                allowClear
                                placeholder="Filter by Module"
                                options={moduleOptions}
                                style={{ width: 180 }}
                                value={rolePermModule}
                                onChange={(val) => setRolePermModule(val)}
                            />
                        </div>

                        {/* Permission List */}
                        <form data-permission-form>
                            <div style={{
                                border: `1px solid ${tokens.neutral.borderLight}`,
                                borderRadius: tokens.component.borderRadius.base,
                                padding: tokens.spacing.md,
                                backgroundColor: tokens.neutral.background,
                                maxHeight: 400,
                                overflowY: 'auto',
                            }}>
                                <Checkbox.Group
                                    style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}
                                    defaultValue={currentRolePermissionSlugs}
                                >
                                    {Object.entries(filteredPermissionsByModule).map(
                                        ([moduleName, perms]) => (
                                            <div key={moduleName} style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs }}>
                                                <div style={{
                                                    fontSize: tokens.typography.fontSize.xs,
                                                    fontWeight: tokens.typography.fontWeight.semibold,
                                                    color: tokens.neutral.textSecondary,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    marginBottom: tokens.spacing.sm,
                                                    position: 'sticky',
                                                    top: -12,
                                                    backgroundColor: tokens.neutral.background,
                                                    padding: '4px 0',
                                                    zIndex: 1,
                                                }}>
                                                    {moduleName}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm, paddingLeft: tokens.spacing.md }}>
                                                    {perms.map((p) => (
                                                        <Checkbox key={p.id} value={p.action}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: tokens.typography.fontSize.sm }}>{p.name}</span>
                                                                <span style={{ fontSize: 11, color: tokens.neutral.textTertiary, fontFamily: tokens.typography.fontFamily.mono }}>
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
