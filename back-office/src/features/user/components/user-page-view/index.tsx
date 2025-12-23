import { useMemo, useState, useEffect } from 'react';
import {
    Button,
    Card,
    Form,
    Modal,
    message,
    Space,
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

    // Initialize modal state when access modal opens with data
    useEffect(() => {
        if (accessUser && userRoleAssignments !== undefined && userPermissionAssignments !== undefined) {
            setSelectedRolesInModal(currentRoleSlugs);
            setSelectedPermsInModal(currentPermissionSlugs);
        }
    }, [accessUser, userRoleAssignments, userPermissionAssignments, currentRoleSlugs, currentPermissionSlugs]);


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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 font-heading">Quản lý User</h1>
                    <p className="text-sm text-slate-500">
                        CRUD user đồng bộ với API backend
                    </p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} className="bg-linear-to-r from-amber-500 to-amber-600 border-none">
                    Thêm user
                </Button>
            </div>

            <Card className="shadow-sm rounded-xl border-slate-100">
                <Space align="center" wrap className="mb-4 w-full">
                    <Input.Search
                        allowClear
                        placeholder="Tìm kiếm email, tên..."
                        onSearch={(val) => {
                            setSearch(val || undefined);
                            setPage(1);
                        }}
                        style={{ width: 240 }}
                    />
                    <Select
                        allowClear
                        placeholder="Lọc theo role"
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
                        placeholder="Lọc theo permission"
                        options={permissionOptions}
                        optionFilterProp="label"
                        onChange={(val) => {
                            setPermissionFilter(val || undefined);
                            setPage(1);
                        }}
                        style={{ minWidth: 260 }}
                    />
                </Space>

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
            </Card>

            <Modal
                key={editingUser?.id || 'create-user-modal'}
                title={<span className="font-heading text-lg">{editingUser ? "Cập nhật user" : "Tạo mới user"}</span>}
                open={isModalOpen}
                centered
                onOk={handleSubmit}
                onCancel={handleCloseModal}
                okText={editingUser ? "Lưu" : "Tạo"}
                cancelText="Hủy"
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

            <Modal
                key={accessUser?.id || 'access-modal'}
                title={accessUser ? `Phân quyền: ${accessUser.email}` : ''}
                open={!!accessUser}
                width={680}
                centered
                onCancel={() => {
                    setAccessUser(null);
                    setDrawerPermSearch(undefined);
                    setDrawerPermModule(undefined);
                }}
                footer={
                    accessUser && (
                        <Space className="w-full justify-end">
                            <Button
                                onClick={() => {
                                    setAccessUser(null);
                                    setDrawerPermSearch(undefined);
                                    setDrawerPermModule(undefined);
                                }}
                            >
                                Hủy
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

                                    // Get current selections from state
                                    // Note: Empty array is valid (user unchecked all)
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
                                                assignRoleToUser.mutateAsync({
                                                    userId: accessUser.id,
                                                    roleSlug: slug,
                                                }),
                                            ),
                                            ...rolesToRemove.map((slug: string) =>
                                                removeRoleFromUser.mutateAsync({
                                                    userId: accessUser.id,
                                                    roleSlug: slug,
                                                }),
                                            ),
                                            ...permsToAdd.map((slug: string) =>
                                                assignPermissionToUser.mutateAsync({
                                                    userId: accessUser.id,
                                                    permissionSlug: slug,
                                                }),
                                            ),
                                            ...permsToRemove.map((slug: string) =>
                                                removePermissionFromUser.mutateAsync({
                                                    userId: accessUser.id,
                                                    permissionSlug: slug,
                                                }),
                                            ),
                                        ]);
                                        message.success('Cập nhật phân quyền thành công');
                                        setAccessUser(null);
                                        setDrawerPermSearch(undefined);
                                        setDrawerPermModule(undefined);
                                    } catch {
                                        message.error('Không thể cập nhật phân quyền');
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
                {accessUser && (
                    <div key={accessUser.id} className="space-y-6">
                        {/* Roles Section */}
                        <div>
                            <h3 className="font-semibold mb-3 text-base">Roles</h3>
                            {userRoleAssignments !== undefined ? (
                                <Checkbox.Group
                                    key={`roles-${accessUser.id}`}
                                    className="flex flex-col gap-2"
                                    options={(roles || []).map((r) => ({
                                        label: `${r.name}${r.isSystem ? ' (system)' : ''}`,
                                        value: r.slug,
                                    }))}
                                    defaultValue={currentRoleSlugs}
                                    onChange={(values) => setSelectedRolesInModal(values as string[])}
                                />
                            ) : (
                                <div className="text-sm text-gray-500">Đang tải...</div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-200" />

                        {/* Permissions Section */}
                        <div>
                            <h3 className="font-semibold mb-3 text-base">Permissions trực tiếp</h3>

                            {/* Search & Filter */}
                            <div className="mb-3">
                                <Space align="center" wrap className="w-full">
                                    <Input.Search
                                        allowClear
                                        placeholder="Tìm quyền..."
                                        onSearch={(val) => setDrawerPermSearch(val || undefined)}
                                        style={{ flex: 1, minWidth: 200 }}
                                    />
                                    <Select
                                        allowClear
                                        placeholder="Lọc theo module"
                                        options={drawerModuleOptions}
                                        style={{ width: 180 }}
                                        value={drawerPermModule}
                                        onChange={(val) => setDrawerPermModule(val)}
                                    />
                                </Space>
                            </div>

                            {/* Permission List */}
                            {userPermissionAssignments !== undefined ? (
                                <div className="border border-slate-200 rounded-md p-3 bg-slate-50/50">
                                    <Checkbox.Group
                                        key={`permissions-${accessUser.id}`}
                                        className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-2"
                                        defaultValue={currentPermissionSlugs}
                                        onChange={(values) => setSelectedPermsInModal(values as string[])}
                                    >
                                        {Object.entries(drawerFilteredPermissionsByModule).map(
                                            ([moduleName, perms]) =>
                                                perms && perms.length ? (
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
                                                ) : null,
                                        )}
                                    </Checkbox.Group>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">Đang tải...</div>
                            )}
                        </div>
                    </div>
                )}
            </Modal >
        </div >
    );
}
