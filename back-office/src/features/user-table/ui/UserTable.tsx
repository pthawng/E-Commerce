import React, { useState } from 'react';
import { Space, Input, Select, Popconfirm, Descriptions, Typography, Row, Col, Tooltip, message, Avatar, Button, Tag } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsersApi, deleteUserApi } from '@/entities/user/api';
import type { User, UserQueryDto } from '@/entities/user/model/types';
import { DeleteOutlined, ReloadOutlined, UserOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { UserFormDialog } from '@/features/user-form/ui/UserFormDialog';
import { useAuth } from '@/entities/user/hooks';
import { SplitLayout } from '@/shared/ui/SplitLayout';
import { LuxuryTable } from '@/shared/ui/DataTable';
import type { ColumnSchema, RowActionConfig } from '@/shared/ui/DataTable';
import { colors } from '@/shared/design-system/colors';

const { Title, Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
    admin: 'magenta', manager: 'volcano', staff: 'geekblue',
};

// ─── User Detail Panel ────────────────────────────────────────────────────────
interface UserDetailProps {
    user: User;
    currentUserId: string | undefined;
    onClose: () => void;
    onEdit: (u: User) => void;
    onDeleted: () => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ user, currentUserId, onClose, onEdit, onDeleted }) => {
    const queryClient = useQueryClient();
    const deleteMutation = useMutation({
        mutationFn: deleteUserApi,
        onSuccess: () => {
            message.success('User deleted');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onDeleted();
        },
        onError: () => message.error('Failed to delete user'),
    });

    const isSelf = user.id === currentUserId;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Avatar size={48} icon={<UserOutlined />} style={{ background: '#4096ff' }} />
                    <div>
                        <Title level={5} style={{ margin: 0 }}>{user.fullName}</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>{user.email}</Text>
                    </div>
                </div>
                <Button type="text" size="small" onClick={onClose} style={{ color: '#8c8c8c' }}>✕</Button>
            </div>

            {/* Actions */}
            <Space style={{ marginBottom: 20 }}>
                <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(user)}>Edit</Button>
                <Tooltip title={isSelf ? 'Cannot delete yourself' : ''}>
                    <Popconfirm
                        title="Delete user?"
                        description={`Remove ${user.fullName} from the system. This cannot be undone.`}
                        onConfirm={() => deleteMutation.mutate(user.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        disabled={isSelf}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />} loading={deleteMutation.isPending} disabled={isSelf}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Tooltip>
            </Space>

            {/* Details */}
            <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Full Name">{user.fullName}</Descriptions.Item>
                <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                <Descriptions.Item label="Role">
                    <Tag color={ROLE_COLORS[user.role] ?? 'default'} style={{ textTransform: 'uppercase' }}>{user.role}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                    <Tag color={user.isActive ? 'success' : 'error'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                </Descriptions.Item>
                {user.phone && <Descriptions.Item label="Phone">{user.phone}</Descriptions.Item>}
                {user.createdAt && (
                    <Descriptions.Item label="Created">
                        {new Date(user.createdAt).toLocaleString()}
                    </Descriptions.Item>
                )}
            </Descriptions>
        </div>
    );
};

// ─── Main Table ───────────────────────────────────────────────────────────────
export const UserTable: React.FC = () => {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const [queryParams, setQueryParams] = useState<UserQueryDto>({ page: 1, limit: 10 });
    const [selected, setSelected] = useState<User | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['users', queryParams],
        queryFn: () => getUsersApi(queryParams),
        placeholderData: (prev) => prev,
    });

    const handleEdit = (u: User) => {
        setEditingUser(u);
        setIsFormVisible(true);
    };

    const schema: ColumnSchema<User>[] = [
        {
            title: 'User',
            key: 'fullName',
            type: 'thumbnail-info',
            renderOptions: {
                imageKey: 'avatarUrl',
                subKey: 'email',
            }
        },
        {
            title: 'Role',
            key: 'role',
            type: 'status-badge',
            width: 140,
            renderOptions: {
                statusMap: {
                    admin: { color: colors.warning.main, bg: `${colors.warning.main}12` },
                    manager: { color: colors.info.main, bg: `${colors.info.main}12` },
                    staff: { color: colors.success.main, bg: `${colors.success.main}12` },
                }
            }
        },
        {
            title: 'Status',
            key: 'isActive',
            type: 'status-badge',
            width: 120,
            renderOptions: {
                statusMap: {
                    true: { color: colors.success.main, bg: `${colors.success.main}12` },
                    false: { color: colors.error.main, bg: `${colors.error.main}12` },
                }
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            type: 'actions',
            width: 100,
            align: 'right',
            renderOptions: {
                actions: (record): RowActionConfig<User>[] => [
                    {
                        key: 'edit',
                        label: 'Edit',
                        icon: <EditOutlined />,
                        onClick: () => handleEdit(record)
                    }
                ]
            }
        }
    ];

    return (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {/* Toolbar */}
            <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                <Col xs={24} md={14}>
                    <Space size="middle" wrap>
                        <Input
                            placeholder="Search name or email..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            onPressEnter={(e) => setQueryParams((p) => ({ ...p, search: e.currentTarget.value, page: 1 }))}
                            onBlur={(e) => setQueryParams((p) => ({ ...p, search: e.target.value, page: 1 }))}
                            style={{ width: 260 }}
                            allowClear
                            size="large"
                            variant="filled"
                        />
                        <Select
                            placeholder="Filter Role"
                            style={{ width: 130 }}
                            allowClear
                            size="large"
                            variant="filled"
                            onChange={(v) => setQueryParams((p) => ({ ...p, role: v, page: 1 }))}
                            options={[
                                { value: 'admin', label: 'Admin' },
                                { value: 'manager', label: 'Manager' },
                                { value: 'staff', label: 'Staff' },
                            ]}
                        />
                    </Space>
                </Col>
                <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                    <Space>
                        <Tooltip title="Refresh">
                            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching} size="large" />
                        </Tooltip>
                    </Space>
                </Col>
            </Row>

            <SplitLayout
                table={
                    <LuxuryTable<User>
                        schema={schema}
                        dataSource={data?.items ?? []}
                        loading={isLoading}
                        selectedRowId={selected?.id}
                        onRowClick={(r) => setSelected(r)}
                        pagination={{
                            current: data?.meta?.page ?? 1,
                            pageSize: data?.meta?.limit ?? 10,
                            total: data?.meta?.totalItems ?? 0,
                        }}
                        onPageChange={(page, limit) => setQueryParams((p) => ({ ...p, page, limit }))}
                    />
                }
                detail={
                    selected ? (
                        <UserDetail
                            user={selected}
                            currentUserId={currentUser?.id}
                            onClose={() => setSelected(null)}
                            onEdit={handleEdit}
                            onDeleted={() => setSelected(null)}
                        />
                    ) : null
                }
            />

            <UserFormDialog
                visible={isFormVisible}
                onClose={() => {
                    setIsFormVisible(false);
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                }}
                user={editingUser}
            />
        </Space>
    );
};
