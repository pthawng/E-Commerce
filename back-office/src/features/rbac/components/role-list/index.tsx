import { Space, Tooltip, Popconfirm, Row, Col, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, SafetyCertificateOutlined, TeamOutlined, KeyOutlined, SettingOutlined } from '@ant-design/icons';
import type { RbacRole } from '../../services/queries';
import { CustomerTag } from '@/shared/ui';
import * as tokens from '@/ui/design-tokens';

const { Text, Title } = Typography;

interface RoleListProps {
    roles: RbacRole[];
    isLoading: boolean;
    onEdit: (role: RbacRole) => void;
    onDelete: (slug: string) => void;
    isDeleting: boolean;
    onManagePermissions?: (role: RbacRole) => void;
}

export function RoleList({ roles, isLoading, onEdit, onDelete, isDeleting, onManagePermissions }: RoleListProps) {
    if (isLoading) {
        return <div style={{ padding: tokens.spacing.xl, textAlign: 'center', color: tokens.neutral.textSecondary }}>Loading roles...</div>;
    }

    if (!roles || roles.length === 0) {
        return <div style={{ padding: tokens.spacing.xl, textAlign: 'center', color: tokens.neutral.textSecondary }}>No roles found.</div>;
    }

    return (
        <div style={{ padding: `${tokens.spacing.md}px 0` }}>
            <Row gutter={[24, 24]}>
                {roles.map((role) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={role.id}>
                        <div
                            style={{
                                backgroundColor: tokens.neutral.surface,
                                border: `1px solid ${tokens.neutral.borderLight}`,
                                borderRadius: tokens.component.borderRadius.lg,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                transition: tokens.component.transition.base,
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: tokens.component.shadow.sm,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = tokens.component.shadow.lg;
                                e.currentTarget.style.borderColor = '#D4AF37';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = tokens.component.shadow.sm;
                                e.currentTarget.style.borderColor = tokens.neutral.borderLight;
                            }}
                        >
                            {/* Top decorative bar */}
                            <div style={{
                                height: 4,
                                width: '100%',
                                background: role.isSystem
                                    ? 'linear-gradient(90deg, #B8860B 0%, #D4AF37 100%)'
                                    : 'linear-gradient(90deg, #6D28D9 0%, #9F7AEA 100%)'
                            }} />

                            <div style={{ padding: tokens.spacing.lg, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.sm }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            backgroundColor: role.isSystem ? '#FFF9E6' : '#F3E8FF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: role.isSystem ? '#B8860B' : '#6D28D9',
                                            fontSize: 20
                                        }}>
                                            {role.isSystem ? <SafetyCertificateOutlined /> : <SettingOutlined />}
                                        </div>
                                        <div>
                                            <Title level={5} style={{ margin: 0, color: tokens.neutral.textPrimary }}>{role.name}</Title>
                                            <Text style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.neutral.textTertiary, fontFamily: tokens.typography.fontFamily.mono }}>
                                                {role.slug}
                                            </Text>
                                        </div>
                                    </div>
                                    <CustomerTag
                                        label={role.isSystem ? 'System' : 'Custom'}
                                        color={role.isSystem ? 'warning' : 'primary'}
                                    />
                                </div>

                                <Text style={{
                                    color: tokens.neutral.textSecondary,
                                    fontSize: tokens.typography.fontSize.sm,
                                    marginBottom: tokens.spacing.lg,
                                    minHeight: 40,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {role.description || 'No description provided for this role.'}
                                </Text>

                                <div style={{ flex: 1 }} />

                                <div style={{
                                    display: 'flex',
                                    gap: tokens.spacing.lg,
                                    padding: `${tokens.spacing.sm}px 0`,
                                    borderTop: `1px dashed ${tokens.neutral.borderLight}`,
                                    borderBottom: `1px solid ${tokens.neutral.borderLight}`,
                                    marginBottom: tokens.spacing.sm
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs, color: tokens.neutral.textSecondary }}>
                                        <TeamOutlined />
                                        <Text strong style={{ fontSize: tokens.typography.fontSize.sm }}>{role._count?.userRoles || 0}</Text>
                                        <Text style={{ fontSize: tokens.typography.fontSize.xs }}>Users</Text>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs, color: tokens.neutral.textSecondary }}>
                                        <KeyOutlined />
                                        <Text strong style={{ fontSize: tokens.typography.fontSize.sm }}>{role._count?.rolePermissions || 0}</Text>
                                        <Text style={{ fontSize: tokens.typography.fontSize.xs }}>Perms</Text>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Space size={0}>
                                        <Tooltip title="Edit Role">
                                            <div
                                                onClick={() => onEdit(role)}
                                                style={{
                                                    padding: tokens.spacing.sm,
                                                    cursor: 'pointer',
                                                    color: tokens.action.secondary,
                                                    borderRadius: tokens.component.borderRadius.base,
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#6D28D9'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = tokens.action.secondary}
                                            >
                                                <EditOutlined style={{ fontSize: 16 }} />
                                            </div>
                                        </Tooltip>

                                        {onManagePermissions && (
                                            <Tooltip title="Manage Permissions">
                                                <div
                                                    onClick={() => onManagePermissions(role)}
                                                    style={{
                                                        padding: tokens.spacing.sm,
                                                        cursor: 'pointer',
                                                        color: tokens.action.secondary,
                                                        borderRadius: tokens.component.borderRadius.base,
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#6D28D9'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = tokens.action.secondary}
                                                >
                                                    <SafetyCertificateOutlined style={{ fontSize: 16 }} />
                                                </div>
                                            </Tooltip>
                                        )}
                                    </Space>

                                    <Popconfirm
                                        title="Delete this role?"
                                        description="This action cannot be undone."
                                        okText="Delete"
                                        cancelText="Cancel"
                                        okButtonProps={{ danger: true, disabled: role.isSystem, loading: isDeleting }}
                                        onConfirm={() => onDelete(role.slug)}
                                        disabled={role.isSystem}
                                    >
                                        <Tooltip title={role.isSystem ? "System roles cannot be deleted" : "Delete Role"}>
                                            <div
                                                style={{
                                                    padding: tokens.spacing.sm,
                                                    cursor: role.isSystem ? 'not-allowed' : 'pointer',
                                                    color: role.isSystem ? tokens.neutral.textQuaternary : tokens.action.danger,
                                                    opacity: role.isSystem ? 0.5 : 1,
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!role.isSystem) e.currentTarget.style.color = tokens.action.dangerHover;
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!role.isSystem) e.currentTarget.style.color = tokens.action.danger;
                                                }}
                                            >
                                                <DeleteOutlined style={{ fontSize: 16 }} />
                                            </div>
                                        </Tooltip>
                                    </Popconfirm>
                                </div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
