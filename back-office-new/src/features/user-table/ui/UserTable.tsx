import { Table, Tag, Button, Space, Input, Select, Modal, Tooltip, Row, Col, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsersApi, deleteUserApi } from '@/entities/user/api';
import type { User, UserQueryDto } from '@/entities/user/model/types';
import { useState } from 'react';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { UserFormDialog } from '@/features/user-form/ui/UserFormDialog';
import { useAuth } from '@/entities/user/hooks';

const { Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
    admin: 'magenta',
    manager: 'volcano',
    staff: 'geekblue'
};

export const UserTable = () => {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const [queryParams, setQueryParams] = useState<UserQueryDto>({
        page: 1,
        limit: 10,
    });
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['users', queryParams],
        queryFn: () => getUsersApi(queryParams),
        // Keep previous data while fetching new page for smooth UX
        placeholderData: (prev) => prev
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUserApi,
        onSuccess: () => {
            message.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const handleDelete = (id: string, name: string) => {
        Modal.confirm({
            title: 'Delete User',
            content: (
                <div>
                    Are you sure you want to delete <Text strong>{name}</Text>?
                    <br />
                    This action cannot be undone.
                </div>
            ),
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            autoFocusButton: 'cancel',
            onOk: () => deleteMutation.mutate(id),
        });
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
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
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.fullName}</Text>
                    <Text type="secondary" style={{ fontSize: '13px' }}>{record.email}</Text>
                </Space>
            )
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            width: 150,
            render: (role) => (
                <Tag color={ROLE_COLORS[role] || 'default'} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {role}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 150,
            render: (isActive) => (
                <Tag color={isActive ? 'success' : 'error'} style={{ borderRadius: '12px', padding: '0 8px' }}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            align: 'right',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit user">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title={record.id === currentUser?.id ? "Cannot delete yourself" : "Delete user"}>
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id, record.fullName)}
                            disabled={record.id === currentUser?.id}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Space size="middle" wrap>
                        <Input
                            placeholder="Search by name or email..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            onPressEnter={(e) => setQueryParams(prev => ({ ...prev, search: e.currentTarget.value, page: 1 }))}
                            onBlur={(e) => setQueryParams(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                            style={{ width: 280 }}
                            allowClear
                        />
                        <Select
                            placeholder="Filter Role"
                            style={{ width: 140 }}
                            allowClear
                            onChange={(value) => setQueryParams(prev => ({ ...prev, role: value, page: 1 }))}
                            options={[
                                { value: 'admin', label: 'Admin' },
                                { value: 'manager', label: 'Manager' },
                                { value: 'staff', label: 'Staff' },
                            ]}
                        />
                    </Space>
                </Col>
                <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                    <Space>
                        <Tooltip title="Refresh data">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => refetch()}
                                loading={isFetching}
                            />
                        </Tooltip>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                            Add User
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={data?.items || []}
                rowKey="id"
                loading={isLoading}
                size="middle"
                pagination={{
                    current: data?.meta?.page || 1,
                    pageSize: data?.meta?.limit || 10,
                    total: data?.meta?.total || 0,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
                    onChange: (page, pageSize) => setQueryParams(prev => ({ ...prev, page, limit: pageSize })),
                }}
            />

            <UserFormDialog
                visible={isFormVisible}
                onClose={() => setIsFormVisible(false)}
                user={editingUser}
            />
        </Space>
    );
};
