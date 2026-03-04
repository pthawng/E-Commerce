import React from 'react';
import { Table, Button, Space, Popconfirm, Tag, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useRoles, useDeleteRole } from '../hooks';
import type { Role } from '../types';
import dayjs from 'dayjs';

export const RoleTable: React.FC = () => {
    const navigate = useNavigate();
    const { data: rolesData, isLoading } = useRoles();
    const deleteRole = useDeleteRole();

    const handleDelete = async (slug: string) => {
        try {
            await deleteRole.mutateAsync(slug);
            message.success('Role deleted successfully');
        } catch (error) {
            message.error('Failed to delete role');
        }
    };

    const columns: ColumnsType<Role> = [
        {
            title: 'Role Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <span style={{ fontWeight: 500 }}>{text}</span>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>{record.slug}</span>
                </Space>
            )
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'System Role',
            dataIndex: 'isSystem',
            key: 'isSystem',
            render: (isSystem: boolean) => (
                <Tag color={isSystem ? 'blue' : 'default'}>
                    {isSystem ? 'SYSTEM' : 'CUSTOM'}
                </Tag>
            )
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                if (record.isSystem) {
                    return <span style={{ color: '#ccc' }}>Immutable</span>;
                }

                return (
                    <Space size="middle">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/roles/${record.slug}`)}
                            title="Edit Role"
                        />
                        <Popconfirm
                            title="Delete role"
                            description="Are you sure you want to delete this role?"
                            onConfirm={() => handleDelete(record.slug)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                loading={deleteRole.isPending}
                            />
                        </Popconfirm>
                    </Space>
                );
            }
        }
    ];

    return (
        <Table
            columns={columns}
            dataSource={rolesData || []}
            rowKey="id"
            loading={isLoading}
            pagination={{ showSizeChanger: true }}
        />
    );
};
