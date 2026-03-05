import React, { useState } from 'react';
import {
    Table, Button, Tag, Form, Input, Select, Popconfirm, Space,
    Typography, Divider, message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SplitLayout } from '@/shared/ui/SplitLayout';
import {
    useAttributes,
    useCreateAttribute, useUpdateAttribute, useDeleteAttribute,
    useCreateAttributeValue, useUpdateAttributeValue, useDeleteAttributeValue,
} from '../hooks';
import type { Attribute, AttributeValue, CreateAttributeDTO } from '../types';

const { Title, Text } = Typography;

const INPUT_TYPE_OPTIONS = [
    { label: 'Text', value: 'TEXT' },
    { label: 'Select / Dropdown', value: 'SELECT' },
    { label: 'Color Swatch', value: 'COLOR' },
    { label: 'Boolean (Yes/No)', value: 'BOOLEAN' },
];

// ─── Inline Value Table ───────────────────────────────────────────────────────
const ValueTable: React.FC<{ attribute: Attribute }> = ({ attribute }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm] = Form.useForm();
    const [addForm] = Form.useForm();
    const [showAdd, setShowAdd] = useState(false);

    const createVal = useCreateAttributeValue();
    const updateVal = useUpdateAttributeValue();
    const deleteVal = useDeleteAttributeValue();

    const startEdit = (v: AttributeValue) => {
        setEditingId(v.id);
        editForm.setFieldsValue({ vi: v.value.vi ?? '', en: v.value.en ?? '', metaValue: v.metaValue ?? '' });
    };

    const handleUpdate = async () => {
        const f = await editForm.validateFields();
        try {
            await updateVal.mutateAsync({
                attributeId: attribute.id,
                valueId: editingId!,
                data: { value: { vi: f.vi, en: f.en }, metaValue: f.metaValue || undefined },
            });
            message.success('Value updated');
            setEditingId(null);
        } catch {
            message.error('Failed to update value');
        }
    };

    const handleAdd = async () => {
        const f = await addForm.validateFields();
        try {
            await createVal.mutateAsync({
                attributeId: attribute.id,
                data: { value: { vi: f.vi, en: f.en }, metaValue: f.metaValue || undefined },
            });
            message.success('Value added');
            addForm.resetFields();
            setShowAdd(false);
        } catch {
            message.error('Failed to add value');
        }
    };

    const columns: ColumnsType<AttributeValue> = [
        {
            title: 'Value (vi)',
            render: (_, r) => editingId === r.id
                ? <Form form={editForm} layout="inline"><Form.Item name="vi"><Input size="small" /></Form.Item></Form>
                : r.value.vi ?? '—',
        },
        {
            title: 'Value (en)',
            render: (_, r) => editingId === r.id
                ? <Form form={editForm} layout="inline"><Form.Item name="en"><Input size="small" /></Form.Item></Form>
                : r.value.en ?? '—',
        },
        {
            title: 'Meta',
            dataIndex: 'metaValue',
            render: (v: string | null, r) => editingId === r.id
                ? <Form form={editForm} layout="inline"><Form.Item name="metaValue"><Input size="small" placeholder="hex/slug/..." /></Form.Item></Form>
                : (v ?? <Text type="secondary">—</Text>),
        },
        {
            title: '',
            width: 80,
            render: (_, r) => editingId === r.id ? (
                <Space>
                    <Button type="text" size="small" icon={<CheckOutlined />} onClick={handleUpdate} loading={updateVal.isPending} />
                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setEditingId(null)} />
                </Space>
            ) : (
                <Space>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => startEdit(r)} />
                    <Popconfirm
                        title="Delete value?"
                        onConfirm={() => deleteVal.mutate({ attributeId: attribute.id, valueId: r.id })}
                        okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong style={{ fontSize: 13 }}>Values ({attribute.values.length})</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>Add Value</Button>
            </div>

            {showAdd && (
                <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                    <Form form={addForm} layout="inline" size="small">
                        <Form.Item name="vi" label="vi" rules={[{ required: true }]}>
                            <Input placeholder="Tiếng Việt" style={{ width: 120 }} />
                        </Form.Item>
                        <Form.Item name="en" label="en">
                            <Input placeholder="English" style={{ width: 120 }} />
                        </Form.Item>
                        <Form.Item name="metaValue" label="meta">
                            <Input placeholder="#hex / slug" style={{ width: 120 }} />
                        </Form.Item>
                        <Button type="primary" size="small" onClick={handleAdd} loading={createVal.isPending}>Add</Button>
                        <Button size="small" style={{ marginLeft: 4 }} onClick={() => { setShowAdd(false); addForm.resetFields(); }}>Cancel</Button>
                    </Form>
                </div>
            )}

            <Table
                columns={columns}
                dataSource={attribute.values}
                rowKey="id"
                size="small"
                pagination={false}
            />
        </div>
    );
};

// ─── Attribute Detail Panel ───────────────────────────────────────────────────
interface AttrDetailProps {
    attribute: Attribute;
    onClose: () => void;
    onUpdated: (a: Attribute) => void;
    onDeleted: () => void;
}

const AttrDetail: React.FC<AttrDetailProps> = ({ attribute, onClose, onUpdated, onDeleted }) => {
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm();
    const updateAttr = useUpdateAttribute();
    const deleteAttr = useDeleteAttribute();

    const startEdit = () => {
        form.setFieldsValue({ name: attribute.name, filterType: attribute.filterType ?? undefined });
        setEditing(true);
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        try {
            const updated = await updateAttr.mutateAsync({ id: attribute.id, data: values });
            message.success('Attribute updated');
            onUpdated(updated);
            setEditing(false);
        } catch {
            message.error('Failed to update attribute');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <Title level={5} style={{ margin: 0 }}>{attribute.name.vi ?? attribute.name.en}</Title>
                    <code style={{ color: '#8c8c8c', fontSize: 12 }}>{attribute.code}</code>
                </div>
                <Button type="text" size="small" onClick={onClose} style={{ color: '#8c8c8c' }}>✕</Button>
            </div>

            <Space style={{ marginBottom: 16 }}>
                {!editing ? (
                    <>
                        <Button size="small" icon={<EditOutlined />} onClick={startEdit}>Edit</Button>
                        <Popconfirm
                            title="Delete attribute?"
                            description="All values will also be deleted."
                            onConfirm={async () => {
                                try {
                                    await deleteAttr.mutateAsync(attribute.id);
                                    message.success('Attribute deleted');
                                    onDeleted();
                                } catch { message.error('Failed to delete'); }
                            }}
                            okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
                        >
                            <Button danger size="small" icon={<DeleteOutlined />} loading={deleteAttr.isPending}>Delete</Button>
                        </Popconfirm>
                    </>
                ) : (
                    <>
                        <Popconfirm title="Save changes?" onConfirm={handleSave} okText="Save" cancelText="Cancel">
                            <Button type="primary" size="small" icon={<CheckOutlined />} loading={updateAttr.isPending}>Save</Button>
                        </Popconfirm>
                        <Button size="small" icon={<CloseOutlined />} onClick={() => setEditing(false)}>Cancel</Button>
                    </>
                )}
            </Space>

            {!editing ? (
                <>
                    <div style={{ marginBottom: 8 }}><Text type="secondary">Type: </Text><Tag>{attribute.filterType ?? '—'}</Tag></div>
                    <Divider />
                    <ValueTable attribute={attribute} />
                </>
            ) : (
                <Form form={form} layout="vertical" size="small">
                    <Form.Item label="Name (vi)" name={['name', 'vi']} rules={[{ required: true }]}>
                        <Input placeholder="Tên hiển thị" />
                    </Form.Item>
                    <Form.Item label="Name (en)" name={['name', 'en']}>
                        <Input placeholder="Display name in English" />
                    </Form.Item>
                    <Form.Item label="Input Type" name="filterType">
                        <Select options={INPUT_TYPE_OPTIONS} allowClear />
                    </Form.Item>
                </Form>
            )}
        </div>
    );
};

// ─── Main Table ───────────────────────────────────────────────────────────────
export const AttributeTable: React.FC = () => {
    const { data: attributes, isLoading } = useAttributes();
    const [selected, setSelected] = useState<Attribute | null>(null);
    const [creating, setCreating] = useState(false);
    const createAttr = useCreateAttribute();
    const [createForm] = Form.useForm<CreateAttributeDTO>();

    const handleCreate = async () => {
        const values = await createForm.validateFields();
        try {
            await createAttr.mutateAsync(values);
            message.success('Attribute created');
            createForm.resetFields();
            setCreating(false);
        } catch {
            message.error('Failed to create attribute');
        }
    };

    const columns: ColumnsType<Attribute> = [
        { title: 'Code', dataIndex: 'code', render: (c: string) => <code style={{ fontSize: 12 }}>{c}</code> },
        { title: 'Name (vi)', render: (_: unknown, r: Attribute) => <span style={{ fontWeight: 500 }}>{r.name.vi ?? r.name.en ?? '—'}</span> },
        { title: 'Type', dataIndex: 'filterType', render: (t: string | null) => t ? <Tag>{t}</Tag> : <span style={{ color: '#bbb' }}>—</span> },
        { title: 'Values', render: (_: unknown, r: Attribute) => <Tag color="blue">{r.values.length}</Tag> },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreating(true); setSelected(null); }}>
                    Add Attribute
                </Button>
            </div>

            <SplitLayout
                table={
                    <Table
                        columns={columns}
                        dataSource={attributes ?? []}
                        rowKey="id"
                        loading={isLoading}
                        size="middle"
                        pagination={{ pageSize: 15, showSizeChanger: false }}
                        onRow={(r) => ({
                            onClick: () => { setSelected(r); setCreating(false); },
                            style: { cursor: 'pointer', background: selected?.id === r.id ? '#e6f4ff' : undefined },
                        })}
                    />
                }
                detail={
                    creating ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <Title level={5} style={{ margin: 0 }}>New Attribute</Title>
                                <Button type="text" size="small" onClick={() => setCreating(false)} style={{ color: '#8c8c8c' }}>✕</Button>
                            </div>
                            <Form form={createForm} layout="vertical" size="small">
                                <Form.Item label="Code" name="code" rules={[{ required: true }]} extra="Unique machine key, e.g. 'color', 'size'">
                                    <Input placeholder="color" style={{ fontFamily: 'monospace' }} />
                                </Form.Item>
                                <Form.Item label="Name (vi)" name={['name', 'vi']} rules={[{ required: true }]}>
                                    <Input placeholder="Màu sắc" />
                                </Form.Item>
                                <Form.Item label="Name (en)" name={['name', 'en']}>
                                    <Input placeholder="Color" />
                                </Form.Item>
                                <Form.Item label="Input Type" name="filterType">
                                    <Select options={INPUT_TYPE_OPTIONS} allowClear />
                                </Form.Item>
                                <Divider />
                                <Space>
                                    <Button type="primary" onClick={handleCreate} loading={createAttr.isPending}>Create</Button>
                                    <Button onClick={() => setCreating(false)}>Cancel</Button>
                                </Space>
                            </Form>
                        </div>
                    ) : selected ? (
                        <AttrDetail
                            attribute={selected}
                            onClose={() => setSelected(null)}
                            onUpdated={(a) => setSelected(a)}
                            onDeleted={() => setSelected(null)}
                        />
                    ) : null
                }
            />
        </>
    );
};
