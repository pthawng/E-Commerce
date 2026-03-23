import React, { useState } from 'react';
import {
    Table, Tag, Button, Descriptions, Popconfirm, Space,
    Form, Input, Checkbox, Row, Col, Typography, Divider, message, Badge,
} from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SplitLayout } from '@/shared/ui/SplitLayout';
import { useRoles, usePermissions, useUpdateRole, useDeleteRole } from '../hooks';
import type { Role, Permission } from '../types';

const { Title, Text } = Typography;

// ─── Detail Panel ────────────────────────────────────────────────────────────
interface RoleDetailProps {
    role: Role;
    allPermissions: Permission[];
    permissionsByModule: Record<string, Permission[]>;
    onClose: () => void;
    onUpdated: (r: Role) => void;
    onDeleted: () => void;
}

const RoleDetail: React.FC<RoleDetailProps> = ({
    role, permissionsByModule, onClose, onUpdated, onDeleted,
}) => {
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm();
    const updateRole = useUpdateRole();
    const deleteRole = useDeleteRole();

    const startEditing = () => {
        form.setFieldsValue({
            name: role.name,
            description: role.description ?? '',
            permissionIds: role.permissions?.map((p) => p.id) ?? [],
        });
        setEditing(true);
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        try {
            const updated = await updateRole.mutateAsync({ id: role.slug, data: values });
            message.success('Role updated');
            onUpdated(updated);
            setEditing(false);
        } catch {
            message.error('Failed to update role');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteRole.mutateAsync(role.slug);
            message.success('Role deleted');
            onDeleted();
        } catch {
            message.error('Cannot delete role — it may be a system role or in use');
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        {role.name}
                        {role.isSystem && <Tag color="gold" style={{ marginLeft: 8, fontSize: 11 }}>System</Tag>}
                    </Title>
                    <code style={{ color: '#8c8c8c', fontSize: 12 }}>{role.slug}</code>
                </div>
                <Button type="text" size="small" onClick={onClose} style={{ color: '#8c8c8c' }}>✕</Button>
            </div>

            {/* Actions */}
            {!editing ? (
                <Space style={{ marginBottom: 20 }}>
                    {!role.isSystem && (
                        <Button icon={<EditOutlined />} size="small" onClick={startEditing}>Edit</Button>
                    )}
                    {!role.isSystem && (
                        <Popconfirm
                            title="Delete role?"
                            description="This action cannot be undone."
                            onConfirm={handleDelete}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger size="small" icon={<DeleteOutlined />} loading={deleteRole.isPending}>
                                Delete
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ) : (
                <Space style={{ marginBottom: 20 }}>
                    <Popconfirm
                        title="Save changes?"
                        description="Confirm to update this role."
                        onConfirm={handleSave}
                        okText="Save"
                        cancelText="Cancel"
                    >
                        <Button type="primary" size="small" icon={<CheckOutlined />} loading={updateRole.isPending}>
                            Save
                        </Button>
                    </Popconfirm>
                    <Button size="small" icon={<CloseOutlined />} onClick={() => setEditing(false)}>Cancel</Button>
                </Space>
            )}

            {/* Detail View */}
            {!editing ? (
                <>
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Description">
                            {role.description ?? <Text type="secondary">—</Text>}
                        </Descriptions.Item>
                        <Descriptions.Item label="System">
                            {role.isSystem ? <Tag color="gold">Yes</Tag> : <Text type="secondary">No</Text>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Created">
                            {new Date(role.createdAt).toLocaleString()}
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider orientation="left" orienrationMargin={0}>
                        <Text style={{ fontSize: 13 }}>Permissions ({role.permissions?.length ?? 0})</Text>
                    </Divider>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {role.permissions?.map((p) => (
                            <Tag key={p.id} color="blue" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                {p.action}
                            </Tag>
                        ))}
                        {!role.permissions?.length && <Text type="secondary">No permissions assigned</Text>}
                    </div>
                </>
            ) : (
                /* Edit Form */
                <Form form={form} layout="vertical" size="small">
                    <Form.Item name="name" label="Role Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Divider orientation="left">Permissions</Divider>
                    <Form.Item name="permissionIds">
                        <Checkbox.Group style={{ width: '100%' }}>
                            {(Object.entries(permissionsByModule) as [string, Permission[]][]).map(([mod, perms]) => (
                                <div key={mod} style={{ marginBottom: 12 }}>
                                    <Text style={{ fontSize: 12, color: '#4096ff', display: 'block', marginBottom: 4 }} strong>
                                        {mod}
                                    </Text>
                                    <Row>
                                        {perms.map((p: Permission) => (
                                            <Col span={24} key={p.id} style={{ marginBottom: 2 }}>
                                                <Checkbox value={p.id}>
                                                    <code style={{ fontSize: 11 }}>{p.action}</code>
                                                </Checkbox>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            ))}
                        </Checkbox.Group>
                    </Form.Item>
                </Form>
            )}
        </div>
    );
};

// ─── Main Table ───────────────────────────────────────────────────────────────
export const RoleTable: React.FC = () => {
    const { data: roles, isLoading } = useRoles();
    const { data: permissions } = usePermissions();
    const [selected, setSelected] = useState<Role | null>(null);

    const permissionsByModule = React.useMemo(() => {
        if (!permissions) return {} as Record<string, Permission[]>;
        return permissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
            const mod = perm.module ?? 'OTHER';
            if (!acc[mod]) acc[mod] = [];
            acc[mod].push(perm);
            return acc;
        }, {} as Record<string, Permission[]>);
    }, [permissions]);

    const columns: ColumnsType<Role> = [
        {
            title: 'Role Name',
            key: 'name',
            render: (_, r) => (
                <span>
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                    {r.isSystem && <Tag color="gold" style={{ marginLeft: 8, fontSize: 11 }}>System</Tag>}
                </span>
            ),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (s: string) => <code style={{ fontSize: 12 }}>{s}</code>,
        },
        {
            title: 'Permissions',
            dataIndex: 'permissions',
            key: 'perms',
            width: 100,
            render: (p: Permission[]) => <Badge count={p?.length ?? 0} showZero color="#4096ff" />,
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 110,
            render: (d: string) => new Date(d).toLocaleDateString(),
        },
    ];

    return (
        <SplitLayout
            table={
                <Table
                    columns={columns}
                    dataSource={roles ?? []}
                    rowKey="id"
                    loading={isLoading}
                    size="middle"
                    pagination={{ pageSize: 10, showSizeChanger: false }}
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
                    <RoleDetail
                        role={selected}
                        allPermissions={permissions ?? []}
                        permissionsByModule={permissionsByModule}
                        onClose={() => setSelected(null)}
                        onUpdated={(r) => setSelected(r)}
                        onDeleted={() => setSelected(null)}
                    />
                ) : null
            }
        />
    );
};
