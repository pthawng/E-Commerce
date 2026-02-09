import { useMemo } from 'react';
import { Table, Space, Tooltip, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RbacRole } from '../../services/queries';
import { CustomerTag } from '@/shared/ui';
import * as tokens from '@/ui/design-tokens';

interface RoleListProps {
    roles: RbacRole[];
    isLoading: boolean;
    onEdit: (role: RbacRole) => void;
    onDelete: (slug: string) => void;
    isDeleting: boolean;
    onManagePermissions?: (role: RbacRole) => void;
}

export function RoleList({ roles, isLoading, onEdit, onDelete, isDeleting, onManagePermissions }: RoleListProps) {
    const roleColumns: ColumnsType<RbacRole> = useMemo(() => [
        {
            title: 'Role Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500, color: tokens.neutral.textPrimary }}>{name}</span>
                    <span style={{ fontSize: 11, color: tokens.neutral.textTertiary, fontFamily: tokens.typography.fontFamily.mono }}>
                        {record.slug}
                    </span>
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'isSystem',
            key: 'isSystem',
            width: 120,
            render: (isSystem: boolean) => (
                <CustomerTag
                    label={isSystem ? 'System' : 'Custom'}
                    color={isSystem ? 'warning' : 'primary'}
                />
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
            title: 'Users',
            dataIndex: ['_count', 'userRoles'],
            key: 'userCount',
            width: 100,
            align: 'center' as const,
            render: (count: number) => (
                <span style={{
                    fontWeight: 500,
                    color: count > 0 ? tokens.neutral.textPrimary : tokens.neutral.textTertiary
                }}>
                    {count ?? 0}
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size={8}>
                    <Tooltip title="Edit Role">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                            style={{ color: tokens.action.secondary }}
                        />
                    </Tooltip>
                    {onManagePermissions && (
                        <Tooltip title="Manage Permissions">
                            <Button
                                type="text"
                                size="small"
                                icon={<SafetyCertificateOutlined />}
                                onClick={() => onManagePermissions(record)}
                                style={{ color: tokens.action.primary }}
                            />
                        </Tooltip>
                    )}
                    <Popconfirm
                        title="Delete this role?"
                        description="This action cannot be undone."
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true, disabled: record.isSystem, loading: isDeleting }}
                        onConfirm={() => onDelete(record.slug)}
                        disabled={record.isSystem}
                    >
                        <Tooltip title={record.isSystem ? "System roles cannot be deleted" : "Delete Role"}>
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={record.isSystem}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ], [onEdit, onDelete, isDeleting, onManagePermissions]);

    return (
        <Table<RbacRole>
            rowKey="id"
            dataSource={roles}
            columns={roleColumns.map(col => ({
                ...col,
                title: <span style={{ fontSize: 13, fontWeight: 500, color: tokens.neutral.textSecondary }}>{col.title}</span>
            }))}
            loading={isLoading}
            pagination={false}
            size="middle"
            onRow={() => ({
                style: { cursor: 'pointer', transition: 'background 0.15s ease' },
                onMouseEnter: (e) => { e.currentTarget.style.background = '#FAFAFA'; },
                onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
            })}
        />
    );
}
