import { useMemo, useState, useEffect } from 'react';
import {
    Button,
    Form,
    Modal,
    message,
    Select,
    Input,
    Checkbox,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { User, PaginatedResponse } from '@shared';
import { UserTable, type UserWithRelations } from '../user-table';
import { UserForm } from '../user-form';
import { useUsers } from '../../services/queries';
import { useCreateUser, useUpdateUser, useDeleteUser } from '../../services/mutations';
import { useRbacRoles, useRbacPermissions } from '@/features/rbac/services/queries';
import {
    useAssignRoleToUser,
    useRemoveRoleFromUser,
    useAssignPermissionToUser,
    useRemovePermissionFromUser,
} from '@/features/rbac/services/mutations';
import { useUserRoles, useUserPermissions } from '@/features/rbac/services/queries';
import { PageHeader, FilterBar } from '@/shared/ui';
import { contentContainerStyle, cardStyle } from '@/ui/styles';
import * as tokens from '@/ui/design-tokens';

type FormValues = {
    email: string;
    fullName: string;
    phone?: string;
    password?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
};

export function UserPageView() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [accessUser, setAccessUser] = useState<UserWithRelations | null>(null);
    const [search, setSearch] = useState<string>();
    const [roleFilter, setRoleFilter] = useState<string>();
    const [permissionFilter, setPermissionFilter] = useState<string>();
    const [drawerPermSearch, setDrawerPermSearch] = useState<string>();
    const [drawerPermModule, setDrawerPermModule] = useState<string>();
    const [selectedRolesInModal, setSelectedRolesInModal] = useState<string[]>([]);
    const [selectedPermsInModal, setSelectedPermsInModal] = useState<string[]>([]);

    const { data, isLoading } = useUsers({
        page,
        limit,
        search,
        role: roleFilter,
        permission: permissionFilter,
    });
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();
    const deleteMutation = useDeleteUser();

    const { data: roles } = useRbacRoles();
    const { data: permissions } = useRbacPermissions();

    const assignRoleToUser = useAssignRoleToUser();
    const removeRoleFromUser = useRemoveRoleFromUser();
    const assignPermissionToUser = useAssignPermissionToUser();
    const removePermissionFromUser = useRemovePermissionFromUser();

    const {
        data: userRoleAssignments
    } = useUserRoles(accessUser?.id, {
        staleTime: 0,
        gcTime: 0,
    });
    const {
        data: userPermissionAssignments
    } = useUserPermissions(accessUser?.id, {
        staleTime: 0,
        gcTime: 0,
    });

    const [form] = Form.useForm<FormValues>();

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({
            isActive: true,
            isEmailVerified: false,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        form.setFieldsValue({
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            password: undefined,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    useEffect(() => {
        if (editingUser && isModalOpen) {
            form.setFieldsValue({
                email: editingUser.email,
                fullName: editingUser.fullName,
                phone: editingUser.phone,
                isActive: editingUser.isActive,
                isEmailVerified: editingUser.isEmailVerified,
                password: undefined,
            });
        }
    }, [editingUser, isModalOpen, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingUser) {
                const payload = { ...values };
                if (!payload.password) {
                    delete payload.password;
                }
                await updateMutation.mutateAsync({ id: editingUser.id, data: payload });
                message.success('Cập nhật user thành công');
            } else {
                await createMutation.mutateAsync(values);
                message.success('Tạo user thành công');
            }
            handleCloseModal();
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
            }
        }
    };

    const handleDelete = async (user: User) => {
        Modal.confirm({
            title: `Xóa user ${user.email}?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await deleteMutation.mutateAsync(user.id);
                    message.success('Đã xóa user');
                } catch (error) {
                    if (error instanceof Error) {
                        message.error(error.message);
                    }
                }
            },
        });
    };

    const paginated = data as PaginatedResponse<UserWithRelations> | undefined;
    const roleOptions = useMemo(
        () =>
            (roles || []).map((r) => ({
                label: r.name,
                value: r.slug,
            })),
        [roles],
    );
    const permissionOptions = useMemo(
        () =>
            (permissions || []).map((p) => ({
                label: p.name,
                value: p.action ?? p.slug ?? '',
            })),
        [permissions],
    );

    const currentRoleSlugs = useMemo(
        () => (userRoleAssignments || []).map((ur) => ur.role.slug),
        [userRoleAssignments],
    );

    const currentPermissionSlugs = useMemo(
        () => (userPermissionAssignments || []).map((up) => up.permission.action),
        [userPermissionAssignments],
    );

    useEffect(() => {
        if (accessUser && userRoleAssignments !== undefined && userPermissionAssignments !== undefined) {
            const arraysEqual = (a?: string[], b?: string[]) => {
                if (a === b) return true;
                if (!a || !b) return false;
                if (a.length !== b.length) return false;
                const aSorted = [...a].sort();
                const bSorted = [...b].sort();
                return aSorted.every((v, i) => v === bSorted[i]);
            };

            const timeout = setTimeout(() => {
                if (!arraysEqual(selectedRolesInModal, currentRoleSlugs)) {
                    setSelectedRolesInModal(currentRoleSlugs);
                }
                if (!arraysEqual(selectedPermsInModal, currentPermissionSlugs)) {
                    setSelectedPermsInModal(currentPermissionSlugs);
                }
            }, 0);

            return () => clearTimeout(timeout);
        }
    }, [
        accessUser,
        userRoleAssignments,
        userPermissionAssignments,
        currentRoleSlugs,
        currentPermissionSlugs,
    ]);


    const drawerModuleOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    (permissions || [])
                        .map((p) => p.module || p.action.split('.')[0]?.toUpperCase() || 'OTHER'),
                ),
            ).map((m) => ({ label: m, value: m })),
        [permissions],
    );

    const drawerFilteredPermissionsByModule = useMemo(() => {
        const search = drawerPermSearch?.toLowerCase() || '';
        const module = drawerPermModule;
        const grouped: Record<string, typeof permissions> = {};

        (permissions || []).forEach((p) => {
            const moduleName = p.module || p.action.split('.')[0]?.toUpperCase() || 'OTHER';
            if (module && moduleName !== module) return;

            if (search) {
                const text = `${p.name} ${p.action}`.toLowerCase();
                if (!text.includes(search)) return;
            }

            if (!grouped[moduleName]) grouped[moduleName] = [];
            grouped[moduleName]!.push(p);
        });

        return grouped;
    }, [permissions, drawerPermSearch, drawerPermModule]);

    return (
        <div>
            {/* Page Header */}
            <PageHeader
                title="Users"
                subtitle="Manage system users and access rights"
                actions={
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                        Add User
                    </Button>
                }
            />

            {/* Filters */}
            <FilterBar>
                <Input.Search
                    allowClear
                    placeholder="Search by email, name..."
                    onSearch={(val) => {
                        setSearch(val || undefined);
                        setPage(1);
                    }}
                    style={{ width: 280 }}
                />
                <Select
                    allowClear
                    placeholder="Filter by Role"
                    options={roleOptions}
                    onChange={(val) => {
                        setRoleFilter(val || undefined);
                        setPage(1);
                    }}
                    style={{ minWidth: 200 }}
                />
                <Select
                    allowClear
                    showSearch
                    placeholder="Filter by Permission"
                    options={permissionOptions}
                    optionFilterProp="label"
                    onChange={(val) => {
                        setPermissionFilter(val || undefined);
                        setPage(1);
                    }}
                    style={{ minWidth: 260 }}
                />
            </FilterBar>

            {/* Content */}
            <div style={contentContainerStyle}>
                <div style={cardStyle}>
                    <UserTable
                        users={paginated?.items || []}
                        isLoading={isLoading}
                        page={paginated?.meta?.page ?? page}
                        limit={paginated?.meta?.limit ?? limit}
                        total={paginated?.meta?.total ?? 0}
                        onPageChange={(p, l) => {
                            setPage(p);
                            setLimit(l);
                        }}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        onManageAccess={(user) => {
                            setAccessUser(user);
                            setSelectedRolesInModal([]);
                            setSelectedPermsInModal([]);
                        }}
                    />
                </div>
            </div>

            {/* User Modal */}
            <Modal
                key={editingUser?.id || 'create-user-modal'}
                title={editingUser ? "Edit User" : "Create New User"}
                open={isModalOpen}
                centered
                onOk={handleSubmit}
                onCancel={handleCloseModal}
                okText={editingUser ? "Save" : "Create"}
                cancelText="Cancel"
                destroyOnClose
                confirmLoading={createMutation.isPending || updateMutation.isPending}
            >
                <UserForm
                    key={editingUser ? editingUser.id : 'create'}
                    form={form}
                    isEditing={!!editingUser}
                    initialValues={editingUser ? {
                        email: editingUser.email,
                        fullName: editingUser.fullName,
                        phone: editingUser.phone,
                        isActive: editingUser.isActive,
                        isEmailVerified: editingUser.isEmailVerified,
                    } : {
                        isActive: true,
                        isEmailVerified: false
                    }}
                />
            </Modal>

            {/* Access Control Modal */}
            <Modal
                key={accessUser?.id || 'access-modal'}
                title={accessUser ? `Manage Access: ${accessUser.email}` : ''}
                open={!!accessUser}
                width={800}
                centered
                onCancel={() => {
                    setAccessUser(null);
                    setDrawerPermSearch(undefined);
                    setDrawerPermModule(undefined);
                }}
                footer={
                    accessUser && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: tokens.spacing.sm }}>
                            <Button
                                onClick={() => {
                                    setAccessUser(null);
                                    setDrawerPermSearch(undefined);
                                    setDrawerPermModule(undefined);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                loading={
                                    assignRoleToUser.isPending ||
                                    removeRoleFromUser.isPending ||
                                    assignPermissionToUser.isPending ||
                                    removePermissionFromUser.isPending
                                }
                                onClick={async () => {
                                    if (!accessUser) return;
                                    const selectedRoles = selectedRolesInModal;
                                    const selectedPerms = selectedPermsInModal;

                                    const prevRoles = currentRoleSlugs;
                                    const prevPerms = currentPermissionSlugs;

                                    const rolesToAdd = selectedRoles.filter((v: string) => !prevRoles.includes(v));
                                    const rolesToRemove = prevRoles.filter((v: string) => !selectedRoles.includes(v));
                                    const permsToAdd = selectedPerms.filter((v: string) => !prevPerms.includes(v));
                                    const permsToRemove = prevPerms.filter((v: string) => !selectedPerms.includes(v));

                                    try {
                                        await Promise.all([
                                            ...rolesToAdd.map((slug: string) =>
                                                assignRoleToUser.mutateAsync({ userId: accessUser.id, roleSlug: slug }),
                                            ),
                                            ...rolesToRemove.map((slug: string) =>
                                                removeRoleFromUser.mutateAsync({ userId: accessUser.id, roleSlug: slug }),
                                            ),
                                            ...permsToAdd.map((slug: string) =>
                                                assignPermissionToUser.mutateAsync({ userId: accessUser.id, permissionSlug: slug }),
                                            ),
                                            ...permsToRemove.map((slug: string) =>
                                                removePermissionFromUser.mutateAsync({ userId: accessUser.id, permissionSlug: slug }),
                                            ),
                                        ]);
                                        message.success('Access rights updated successfully');
                                        setAccessUser(null);
                                        setDrawerPermSearch(undefined);
                                        setDrawerPermModule(undefined);
                                    } catch {
                                        message.error('Failed to update access rights');
                                    }
                                }}
                            >
                                Save Changes
                            </Button>
                        </div>
                    )
                }
                destroyOnClose
            >
                {accessUser && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xl }}>
                        {/* Roles Section */}
                        <div>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.md,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                marginBottom: tokens.spacing.md,
                            }}>Roles</h3>
                            {userRoleAssignments !== undefined ? (
                                <Checkbox.Group
                                    key={`roles-${accessUser.id}`}
                                    style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}
                                    options={(roles || []).map((r) => ({
                                        label: `${r.name}${r.isSystem ? ' (system)' : ''}`,
                                        value: r.slug,
                                    }))}
                                    defaultValue={currentRoleSlugs}
                                    onChange={(values) => setSelectedRolesInModal(values as string[])}
                                />
                            ) : (
                                <div style={{ color: tokens.neutral.textSecondary }}>Loading...</div>
                            )}
                        </div>

                        <div style={{ height: 1, backgroundColor: tokens.neutral.borderLight }} />

                        {/* Permissions Section */}
                        <div>
                            <h3 style={{
                                fontSize: tokens.typography.fontSize.md,
                                fontWeight: tokens.typography.fontWeight.semibold,
                                marginBottom: tokens.spacing.md,
                            }}>Direct Permissions</h3>

                            {/* Search & Filter */}
                            <div style={{ marginBottom: tokens.spacing.md, display: 'flex', gap: tokens.spacing.md }}>
                                <Input.Search
                                    allowClear
                                    placeholder="Search permissions..."
                                    onSearch={(val) => setDrawerPermSearch(val || undefined)}
                                    style={{ flex: 1 }}
                                />
                                <Select
                                    allowClear
                                    placeholder="Filter by Module"
                                    options={drawerModuleOptions}
                                    style={{ width: 180 }}
                                    value={drawerPermModule}
                                    onChange={(val) => setDrawerPermModule(val)}
                                />
                            </div>

                            {/* Permission List */}
                            {userPermissionAssignments !== undefined ? (
                                <div style={{
                                    border: `1px solid ${tokens.neutral.borderLight}`,
                                    borderRadius: tokens.component.borderRadius.base,
                                    padding: tokens.spacing.md,
                                    backgroundColor: tokens.neutral.background,
                                    maxHeight: 400,
                                    overflowY: 'auto',
                                }}>
                                    <Checkbox.Group
                                        key={`permissions-${accessUser.id}`}
                                        style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}
                                        defaultValue={currentPermissionSlugs}
                                        onChange={(values) => setSelectedPermsInModal(values as string[])}
                                    >
                                        {Object.entries(drawerFilteredPermissionsByModule).map(
                                            ([moduleName, perms]) =>
                                                perms && perms.length ? (
                                                    <div key={moduleName}>
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
                                                ) : null,
                                        )}
                                    </Checkbox.Group>
                                </div>
                            ) : (
                                <div style={{ color: tokens.neutral.textSecondary }}>Loading...</div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
