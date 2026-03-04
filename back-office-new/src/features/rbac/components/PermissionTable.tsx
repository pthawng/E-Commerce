import React from 'react';
import { Table, Button, Tag, Space, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { usePermissions, useDeletePermission } from '../hooks';
import type { Permission } from '../types';

const MODULE_COLORS: Record<string, string> = {
    AUTH: 'blue',
    PRODUCT: 'green',
    ORDER: 'orange',
    DISCOUNT: 'purple',
    CMS: 'cyan',
    SYSTEM: 'red',
};

export const PermissionTable: React.FC = () => {
    const navigate = useNavigate();
    const { data: permissions, isLoading } = usePermissions();
    const deletePerm = useDeletePermission();

    const handleDelete = async (slug: string) => {
        try {
            await deletePerm.mutateAsync(slug);
            message.success('Permission deleted');
        } catch {
            message.error('Failed to delete permission');
        }
    };

    const columns: ColumnsType<Permission> = [
        {
            title: 'Action (Slug)',
            dataIndex: 'action',
            key: 'action',
            render: (action: string) => <code style={{ fontSize: 12 }}>{action}</code>,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
        },
        {
            title: 'Module',
            dataIndex: 'module',
            key: 'module',
            render: (module: string | null) =>
                module ? (
                    <Tag color={MODULE_COLORS[module] ?? 'default'}>{module}</Tag>
                ) : (
                    <Tag color="default">—</Tag>
                ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (v: string | null) => v ?? <span style={{ color: '#bbb' }}>—</span>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/permissions/${record.action}`)}
                    />
                    <Popconfirm
                        title="Delete Permission"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record.action ?? '')}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            loading={deletePerm.isPending}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={permissions ?? []}
            rowKey="id"
            loading={isLoading}
            pagination={{ showSizeChanger: true, pageSize: 20 }}
        />
    );
};
