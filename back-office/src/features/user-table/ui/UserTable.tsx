import React, { useState } from 'react';
import {
    Table, Tag, Button, Space, Input, Select, Popconfirm, Descriptions,
    Typography, Row, Col, Tooltip, message, Form, Avatar,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsersApi, deleteUserApi } from '@/entities/user/api';
import type { User, UserQueryDto } from '@/entities/user/model/types';
import {
    DeleteOutlined, PlusOutlined, SearchOutlined, ReloadOutlined,
    UserOutlined, EditOutlined,
} from '@ant-design/icons';
import { UserFormDialog } from '@/features/user-form/ui/UserFormDialog';
import { useAuth } from '@/entities/user/hooks';
import { SplitLayout } from '@/shared/ui/SplitLayout';

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
                        <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={deleteMutation.isPending}
                            disabled={isSelf}
                        >
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
                    <Tag color={ROLE_COLORS[user.role] ?? 'default'}>{user.role}</Tag>
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

    const handleCreate = () => {
        setEditingUser(undefined);
        setIsFormVisible(true);
    };

    const columns: ColumnsType<User> = [
        {
            title: 'User',
            key: 'user',
            render: (_, r) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{r.fullName}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>{r.email}</Text>
                </Space>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            width: 130,
            render: (role: string) => (
                <Tag color={ROLE_COLORS[role] ?? 'default'} style={{ textTransform: 'uppercase' }}>
                    {role}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            width: 100,
            render: (active: boolean) => (
                <Tag color={active ? 'success' : 'error'}>{active ? 'Active' : 'Inactive'}</Tag>
            ),
        },
    ];

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Toolbar */}
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col xs={24} md={14}>
                    <Space size="middle" wrap>
                        <Input
                            placeholder="Search name or email..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            onPressEnter={(e) => setQueryParams((p) => ({ ...p, search: e.currentTarget.value, page: 1 }))}
                            onBlur={(e) => setQueryParams((p) => ({ ...p, search: e.target.value, page: 1 }))}
                            style={{ width: 260 }}
                            allowClear
                        />
                        <Select
                            placeholder="Filter Role"
                            style={{ width: 130 }}
                            allowClear
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
                            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching} />
                        </Tooltip>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                            Add User
                        </Button>
                    </Space>
                </Col>
            </Row>

            <SplitLayout
                table={
                    <Table
                        columns={columns}
                        dataSource={data?.items ?? []}
                        rowKey="id"
                        loading={isLoading}
                        size="middle"
                        pagination={{
                            current: data?.meta?.page ?? 1,
                            pageSize: data?.meta?.limit ?? 10,
                            total: data?.meta?.total ?? 0,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                            onChange: (page, limit) => setQueryParams((p) => ({ ...p, page, limit })),
                        }}
                        onRow={(record) => ({
                            onClick: () => setSelected(record),
                            style: {
                                cursor: 'pointer',
                                background: selected?.id === record.id ? '#e6f4ff' : undefined,
                            },
                        })}
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
