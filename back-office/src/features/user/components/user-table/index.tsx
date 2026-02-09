import { useMemo } from 'react';
import { Table, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import type { User } from '@shared';
import { StatusBadge, CustomerTag } from '@/shared/ui';
import * as tokens from '@/ui/design-tokens';

export interface UserWithRelations extends User {
    userRoles?: Array<{
        role: {
            slug: string;
            name: string;
            isSystem?: boolean;
        };
    }>;
}

interface UserTableProps {
    users: UserWithRelations[];
    isLoading: boolean;
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number, limit: number) => void;
    onEdit: (user: UserWithRelations) => void;
    onDelete: (user: UserWithRelations) => void;
    onManageAccess?: (user: UserWithRelations) => void;
}

export function UserTable({
    users,
    isLoading,
    page,
    limit,
    total,
    onPageChange,
    onEdit,
    onDelete,
    onManageAccess,
}: UserTableProps) {
    const columns: ColumnsType<UserWithRelations> = useMemo(
        () => [
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                render: (email: string) => (
                    <span style={{ fontWeight: 500, color: tokens.neutral.textPrimary }}>{email}</span>
                ),
            },
            {
                title: 'Full Name',
                dataIndex: 'fullName',
                key: 'fullName',
                render: (name: string) => name || <span style={{ color: tokens.neutral.textTertiary }}>-</span>,
            },
            {
                title: 'Phone',
                dataIndex: 'phone',
                key: 'phone',
                render: (value?: string) => value || <span style={{ color: tokens.neutral.textTertiary }}>-</span>,
            },
            {
                title: 'Roles',
                key: 'roles',
                render: (_, record) => {
                    const roles = record.userRoles?.map((ur) => ur.role) || [];
                    if (!roles.length) return <CustomerTag label="Default" color="default" />;
                    return (
                        <Space size={4} wrap>
                            {roles.map((r) => (
                                <CustomerTag
                                    key={r.slug}
                                    label={r.name}
                                    color={r.isSystem ? 'warning' : 'primary'}
                                />
                            ))}
                        </Space>
                    );
                },
            },
            {
                title: 'Status',
                dataIndex: 'isActive',
                key: 'isActive',
                width: 120,
                render: (isActive: boolean) => (
                    <StatusBadge
                        status={isActive ? 'active' : 'inactive'}
                        label={isActive ? 'Active' : 'Inactive'}
                    />
                ),
            },
            {
                title: 'Email Verified',
                dataIndex: 'isEmailVerified',
                key: 'isEmailVerified',
                width: 140,
                render: (verified: boolean) => (
                    <StatusBadge
                        status={verified ? 'verified' : 'pending'}
                        label={verified ? 'Verified' : 'Unverified'}
                    />
                ),
            },
            {
                title: 'Created At',
                dataIndex: 'createdAt',
                key: 'createdAt',
                width: 160,
                render: (value: string | Date) => (
                    <span style={{ color: tokens.neutral.textSecondary, fontSize: tokens.typography.fontSize.sm }}>
                        {dayjs(value).format('DD/MM/YYYY')}
                    </span>
                ),
            },
            {
                title: 'Actions',
                key: 'actions',
                width: 140,
                fixed: 'right' as const,
                render: (_, record) => (
                    <Space size={8}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                            style={{ color: tokens.action.secondary, fontSize: 13 }}
                        />
                        {onManageAccess && (
                            <Button
                                type="text"
                                size="small"
                                icon={<KeyOutlined />}
                                onClick={() => onManageAccess(record)}
                                style={{ color: tokens.action.primary, fontSize: 13 }}
                                title="Manage Access"
                            />
                        )}
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => onDelete(record)}
                            style={{ fontSize: 13 }}
                        />
                    </Space>
                ),
            },
        ],
        [onEdit, onDelete, onManageAccess],
    );

    return (
        <Table<UserWithRelations>
            rowKey="id"
            loading={isLoading}
            columns={columns.map(col => ({
                ...col,
                title: typeof col.title === 'function'
                    ? col.title
                    : <span style={{ fontSize: 13, fontWeight: 500, color: tokens.neutral.textSecondary }}>{col.title}</span>
            }))}
            dataSource={users}
            pagination={{
                current: page,
                pageSize: limit,
                total: total,
                showSizeChanger: true,
                onChange: onPageChange,
            }}
            scroll={{ x: 1200 }}
            size="middle"
            onRow={() => ({
                style: { cursor: 'pointer', transition: 'background 0.15s ease' },
                onMouseEnter: (e) => { e.currentTarget.style.background = '#FAFAFA'; },
                onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
            })}
        />
    );
}
