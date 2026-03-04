import { useMemo } from 'react';
import { Space, Tooltip, Popconfirm, Collapse, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, KeyOutlined, BlockOutlined } from '@ant-design/icons';
import type { RbacPermission } from '../../services/queries';
import { CustomerTag } from '@/shared/ui';
import * as tokens from '@/ui/design-tokens';

const { Text } = Typography;

interface PermissionListProps {
    permissions: RbacPermission[];
    isLoading: boolean;
    onEdit: (permission: RbacPermission) => void;
    onDelete: (slug: string) => void;
    isDeleting: boolean;
}

export function PermissionList({ permissions, isLoading, onEdit, onDelete, isDeleting }: PermissionListProps) {
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, RbacPermission[]> = {};
        (permissions || []).forEach((p) => {
            const moduleName = p.module || p.action.split('.')[0]?.toUpperCase() || 'OTHER';
            if (!groups[moduleName]) groups[moduleName] = [];
            groups[moduleName].push(p);
        });

        // Sort groups alphabetically
        return Object.keys(groups)
            .sort()
            .reduce((acc, key) => {
                acc[key] = groups[key].sort((a, b) => a.action.localeCompare(b.action));
                return acc;
            }, {} as Record<string, RbacPermission[]>);
    }, [permissions]);

    if (isLoading) {
        return <div style={{ padding: tokens.spacing.xl, textAlign: 'center', color: tokens.neutral.textSecondary }}>Loading permissions...</div>;
    }

    if (!permissions || permissions.length === 0) {
        return <div style={{ padding: tokens.spacing.xl, textAlign: 'center', color: tokens.neutral.textSecondary }}>No permissions found.</div>;
    }

    const items = Object.entries(groupedPermissions).map(([moduleName, perms]) => ({
        key: moduleName,
        label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Space size="middle">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: tokens.component.borderRadius.base,
                        backgroundColor: '#F3E8FF',
                        color: '#6D28D9'
                    }}>
                        <BlockOutlined />
                    </div>
                    <Text strong style={{ fontSize: tokens.typography.fontSize.md, color: tokens.neutral.textPrimary, letterSpacing: '0.02em' }}>
                        {moduleName}
                    </Text>
                </Space>
                <CustomerTag label={`${perms.length} actions`} color="default" />
            </div>
        ),
        children: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                {perms.map((p) => (
                    <div
                        key={p.id}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: tokens.spacing.md,
                            backgroundColor: tokens.neutral.surface,
                            borderRadius: tokens.component.borderRadius.base,
                            border: `1px solid ${tokens.neutral.borderLight}`,
                            transition: tokens.component.transition.fast,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#D4AF37';
                            e.currentTarget.style.backgroundColor = '#FFFAF0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = tokens.neutral.borderLight;
                            e.currentTarget.style.backgroundColor = tokens.neutral.surface;
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md }}>
                                <Text strong style={{ color: tokens.neutral.textPrimary }}>{p.name}</Text>
                                <span style={{
                                    fontSize: tokens.typography.fontSize.xs,
                                    color: tokens.neutral.textTertiary,
                                    fontFamily: tokens.typography.fontFamily.mono,
                                    backgroundColor: tokens.neutral.background,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    border: `1px solid ${tokens.neutral.borderLight}`
                                }}>
                                    <KeyOutlined style={{ marginRight: 4 }} />
                                    {p.action}
                                </span>
                            </div>
                            {p.description && (
                                <Text style={{ color: tokens.neutral.textSecondary, fontSize: tokens.typography.fontSize.sm }}>
                                    {p.description}
                                </Text>
                            )}
                        </div>
                        <Space size={4} style={{ marginLeft: tokens.spacing.md }}>
                            <Tooltip title="Edit Permission">
                                <div
                                    onClick={() => onEdit(p)}
                                    style={{
                                        padding: tokens.spacing.sm,
                                        cursor: 'pointer',
                                        color: tokens.action.secondary,
                                        borderRadius: tokens.component.borderRadius.base,
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#6D28D9'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = tokens.action.secondary}
                                >
                                    <EditOutlined />
                                </div>
                            </Tooltip>

                            <Popconfirm
                                title="Delete this permission?"
                                description="This action cannot be undone."
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true, loading: isDeleting }}
                                onConfirm={() => onDelete(p.action)}
                            >
                                <Tooltip title="Delete Permission">
                                    <div
                                        style={{
                                            padding: tokens.spacing.sm,
                                            cursor: 'pointer',
                                            color: tokens.action.danger,
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = tokens.action.dangerHover}
                                        onMouseLeave={(e) => e.currentTarget.style.color = tokens.action.danger}
                                    >
                                        <DeleteOutlined />
                                    </div>
                                </Tooltip>
                            </Popconfirm>
                        </Space>
                    </div>
                ))}
            </div>
        )
    }));

    return (
        <div style={{ padding: `${tokens.spacing.md}px 0` }}>
            <Collapse
                items={items}
                defaultActiveKey={items.length > 0 ? [items[0].key] : []}
                expandIconPosition="end"
                ghost
                style={{
                    backgroundColor: tokens.neutral.background,
                    borderRadius: tokens.component.borderRadius.lg,
                    border: `1px solid ${tokens.neutral.borderLight}`,
                    padding: tokens.spacing.sm
                }}
            />
        </div>
    );
}
