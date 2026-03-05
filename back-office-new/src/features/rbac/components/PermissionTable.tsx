import React, { useState } from 'react';
import {
    Table, Tag, Button, Descriptions, Popconfirm, Space,
    Form, Input, Select, Typography, message,
} from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SplitLayout } from '@/shared/ui/SplitLayout';
import { usePermissions, useUpdatePermission, useDeletePermission } from '../hooks';
import { PermissionModule } from '../types';
import type { Permission, CreatePermissionDTO } from '../types';

const { Title, Text } = Typography;

const MODULE_COLORS: Record<string, string> = {
    AUTH: 'blue', PRODUCT: 'green', ORDER: 'orange', DISCOUNT: 'purple', CMS: 'cyan', SYSTEM: 'red',
};
const MODULE_OPTIONS = Object.values(PermissionModule).map((m) => ({ label: m, value: m }));

// ─── Detail Panel ────────────────────────────────────────────────────────────
interface PermDetailProps {
    perm: Permission;
    onClose: () => void;
    onUpdated: (p: Permission) => void;
    onDeleted: () => void;
}

const PermDetail: React.FC<PermDetailProps> = ({ perm, onClose, onUpdated, onDeleted }) => {
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm<CreatePermissionDTO>();
    const updatePerm = useUpdatePermission();
    const deletePerm = useDeletePermission();

    const startEditing = () => {
        form.setFieldsValue({
            slug: perm.action ?? '',
            name: perm.name,
            description: perm.description ?? undefined,
            module: perm.module ?? undefined,
        });
        setEditing(true);
    };

    const handleSave = async () => {
        if (!perm.action) return;
        const values = await form.validateFields();
        try {
            const updated = await updatePerm.mutateAsync({ slug: perm.action, data: values });
            message.success('Permission updated');
            onUpdated(updated);
            setEditing(false);
        } catch {
            message.error('Failed to update permission');
        }
    };

    const handleDelete = async () => {
        if (!perm.action) return;
        try {
            await deletePerm.mutateAsync(perm.action);
            message.success('Permission deleted');
            onDeleted();
        } catch {
            message.error('Cannot delete — permission is in use');
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <Title level={5} style={{ margin: 0, fontFamily: 'monospace' }}>{perm.action}</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>{perm.name}</Text>
                </div>
                <Button type="text" size="small" onClick={onClose} style={{ color: '#8c8c8c' }}>✕</Button>
            </div>

            {/* Actions */}
            {!editing ? (
                <Space style={{ marginBottom: 16 }}>
                    <Button icon={<EditOutlined />} size="small" onClick={startEditing}>Edit</Button>
                    <Popconfirm
                        title="Delete permission?"
                        description="Cannot delete if assigned to a role or user."
                        onConfirm={handleDelete}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />} loading={deletePerm.isPending}>Delete</Button>
                    </Popconfirm>
                </Space>
            ) : (
                <Space style={{ marginBottom: 16 }}>
                    <Popconfirm
                        title="Save changes?"
                        description="Confirm to update this permission."
                        onConfirm={handleSave}
                        okText="Save"
                        cancelText="Cancel"
                    >
                        <Button type="primary" size="small" icon={<CheckOutlined />} loading={updatePerm.isPending}>Save</Button>
                    </Popconfirm>
                    <Button size="small" icon={<CloseOutlined />} onClick={() => setEditing(false)}>Cancel</Button>
                </Space>
            )}

            {/* Detail View */}
            {!editing ? (
                <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Action">
                        <code>{perm.action}</code>
                    </Descriptions.Item>
                    <Descriptions.Item label="Name">{perm.name}</Descriptions.Item>
                    <Descriptions.Item label="Module">
                        {perm.module
                            ? <Tag color={MODULE_COLORS[perm.module] ?? 'default'}>{perm.module}</Tag>
                            : <Text type="secondary">—</Text>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Description">
                        {perm.description ?? <Text type="secondary">—</Text>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">
                        {new Date(perm.createdAt).toLocaleString()}
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <Form form={form} layout="vertical" size="small">
                    <Form.Item name="slug" label="Action Slug">
                        <Input disabled style={{ fontFamily: 'monospace' }} />
                    </Form.Item>
                    <Form.Item name="name" label="Display Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="module" label="Module">
                        <Select options={MODULE_OPTIONS} allowClear placeholder="Select module" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            )}
        </div>
    );
};

// ─── Main Table ───────────────────────────────────────────────────────────────
export const PermissionTable: React.FC = () => {
    const { data: permissions, isLoading } = usePermissions();
    const [selected, setSelected] = useState<Permission | null>(null);

    const columns: ColumnsType<Permission> = [
        {
            title: 'Action Slug',
            dataIndex: 'action',
            render: (a: string) => <code style={{ fontSize: 12 }}>{a}</code>,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            render: (n: string) => <span style={{ fontWeight: 500 }}>{n}</span>,
        },
        {
            title: 'Module',
            dataIndex: 'module',
            width: 100,
            render: (m: string | null) =>
                m ? <Tag color={MODULE_COLORS[m] ?? 'default'}>{m}</Tag> : <span style={{ color: '#bbb' }}>—</span>,
        },
    ];

    return (
        <SplitLayout
            table={
                <Table
                    columns={columns}
                    dataSource={permissions ?? []}
                    rowKey="id"
                    loading={isLoading}
                    size="middle"
                    pagination={{ pageSize: 20, showSizeChanger: false }}
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
                    <PermDetail
                        perm={selected}
                        onClose={() => setSelected(null)}
                        onUpdated={(p) => setSelected(p)}
                        onDeleted={() => setSelected(null)}
                    />
                ) : null
            }
        />
    );
};
