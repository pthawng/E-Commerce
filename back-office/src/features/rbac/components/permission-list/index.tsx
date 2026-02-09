import { useMemo } from 'react';
import { Table, Space, Tooltip, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RbacPermission } from '../../services/queries';
import { CustomerTag } from '@/shared/ui';
import * as tokens from '@/ui/design-tokens';

interface PermissionListProps {
    permissions: RbacPermission[];
    isLoading: boolean;
    onEdit: (permission: RbacPermission) => void;
    onDelete: (slug: string) => void;
    isDeleting: boolean;
}

export function PermissionList({ permissions, isLoading, onEdit, onDelete, isDeleting }: PermissionListProps) {
    const permissionColumns: ColumnsType<RbacPermission> = useMemo(() => [
        {
            title: 'Permission Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500, color: tokens.neutral.textPrimary }}>{name}</span>
                    <span style={{ fontSize: 11, color: tokens.neutral.textTertiary, fontFamily: tokens.typography.fontFamily.mono }}>
                        {record.action}
                    </span>
                </div>
            ),
        },
        {
            title: 'Module',
            dataIndex: 'module',
            key: 'module',
            width: 140,
            render: (module: string) => (
                module ? <CustomerTag label={module} color="default" /> : <span style={{ color: tokens.neutral.textTertiary }}>-</span>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (desc: string) => (
                <span style={{ color: tokens.neutral.textSecondary }}>
                    {desc || '-'}
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Space size={8}>
                    <Tooltip title="Edit Permission">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                            style={{ color: tokens.action.secondary }}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this permission?"
                        description="This action cannot be undone."
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true, loading: isDeleting }}
                        onConfirm={() => onDelete(record.action)}
                    >
                        <Tooltip title="Delete Permission">
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ], [onEdit, onDelete, isDeleting]);

    return (
        <Table<RbacPermission>
            rowKey="id"
            dataSource={permissions}
            columns={permissionColumns.map(col => ({
                ...col,
                title: <span style={{ fontSize: 13, fontWeight: 500, color: tokens.neutral.textSecondary }}>{col.title}</span>
            }))}
            loading={isLoading}
            pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => <span style={{ color: tokens.neutral.textSecondary }}>Total {total} items</span>
            }}
            size="middle"
            onRow={() => ({
                style: { cursor: 'pointer', transition: 'background 0.15s ease' },
                onMouseEnter: (e) => { e.currentTarget.style.background = '#FAFAFA'; },
                onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
            })}
        />
    );
}
