import React, { useState } from 'react';
import {
    Tree, Button, Form, Input, Switch, Select, Typography,
    Popconfirm, Space, Descriptions, message, Divider, Tag, Spin,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { SplitLayout } from '@/shared/ui/SplitLayout';
import {
    useCategoryTree, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from '@/entities/category/model/queries';
import type { Category, CreateCategoryDTO } from '@/entities/category/model/types';

const { Title } = Typography;

// Flatten category tree to build parentId options
const flattenTree = (cats: Category[], depth = 0): { label: string; value: string }[] =>
    cats.flatMap((c) => [
        { label: `${'  '.repeat(depth)}${c.name.vi ?? c.name.en ?? c.slug}`, value: c.id },
        ...flattenTree(c.children ?? [], depth + 1),
    ]);

// Convert Category[] tree to Ant Design DataNode[]
const toTreeNodes = (cats: Category[]): DataNode[] =>
    cats.map((c) => ({
        key: c.id,
        title: (
            <span>
                {c.name.vi ?? c.name.en ?? c.slug}
                {!c.isActive && <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>Inactive</Tag>}
            </span>
        ),
        children: c.children?.length ? toTreeNodes(c.children) : undefined,
        isLeaf: !c.children?.length,
        data: c,
    }));

// ─── Detail Panel ─────────────────────────────────────────────────────────────
interface CatDetailProps {
    cat: Category;
    parentOptions: { label: string; value: string }[];
    onClose: () => void;
    onUpdated: (c: Category) => void;
    onDeleted: () => void;
}

const CatDetail: React.FC<CatDetailProps> = ({ cat, parentOptions, onClose, onUpdated, onDeleted }) => {
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm<CreateCategoryDTO>();
    const updateCat = useUpdateCategory();
    const deleteCat = useDeleteCategory();

    const startEdit = () => {
        form.setFieldsValue({
            name: cat.name,
            slug: cat.slug,
            parentId: cat.parentId ?? undefined,
            order: cat.order,
            isActive: cat.isActive,
        });
        setEditing(true);
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        try {
            const updated = await updateCat.mutateAsync({ id: cat.id, data: values });
            message.success('Category updated');
            onUpdated(updated);
            setEditing(false);
        } catch {
            message.error('Failed to update category');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCat.mutateAsync(cat.id);
            message.success('Category deleted');
            onDeleted();
        } catch {
            message.error('Cannot delete — category may have products');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <Title level={5} style={{ margin: 0 }}>{cat.name.vi ?? cat.name.en}</Title>
                    <code style={{ color: '#8c8c8c', fontSize: 12 }}>{cat.slug}</code>
                </div>
                <Button type="text" size="small" onClick={onClose} style={{ color: '#8c8c8c' }}>✕</Button>
            </div>

            <Space style={{ marginBottom: 16 }}>
                {!editing ? (
                    <>
                        <Button size="small" icon={<EditOutlined />} onClick={startEdit}>Edit</Button>
                        <Popconfirm
                            title="Delete category?"
                            description="Products in this category will be unlinked."
                            onConfirm={handleDelete}
                            okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
                        >
                            <Button danger size="small" icon={<DeleteOutlined />} loading={deleteCat.isPending}>Delete</Button>
                        </Popconfirm>
                    </>
                ) : (
                    <>
                        <Popconfirm title="Save changes?" onConfirm={handleSave} okText="Save" cancelText="Cancel">
                            <Button type="primary" size="small" icon={<CheckOutlined />} loading={updateCat.isPending}>Save</Button>
                        </Popconfirm>
                        <Button size="small" icon={<CloseOutlined />} onClick={() => setEditing(false)}>Cancel</Button>
                    </>
                )}
            </Space>

            {!editing ? (
                <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Name (vi)">{cat.name.vi ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Name (en)">{cat.name.en ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Slug"><code>{cat.slug}</code></Descriptions.Item>
                    <Descriptions.Item label="Status">
                        <Tag color={cat.isActive ? 'success' : 'default'}>{cat.isActive ? 'Active' : 'Inactive'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Order">{cat.order}</Descriptions.Item>
                </Descriptions>
            ) : (
                <Form form={form} layout="vertical" size="small">
                    <Form.Item label="Name (vi)" name={['name', 'vi']} rules={[{ required: true }]}>
                        <Input placeholder="Tên tiếng Việt" />
                    </Form.Item>
                    <Form.Item label="Name (en)" name={['name', 'en']}>
                        <Input placeholder="English name" />
                    </Form.Item>
                    <Form.Item label="Slug" name="slug">
                        <Input placeholder="auto-generated if empty" />
                    </Form.Item>
                    <Form.Item label="Parent Category" name="parentId">
                        <Select options={parentOptions} allowClear placeholder="Top-level category" />
                    </Form.Item>
                    <Form.Item label="Order" name="order">
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item label="Active" name="isActive" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            )}
        </div>
    );
};

// ─── Create Form Panel ────────────────────────────────────────────────────────
interface CreatePanelProps {
    parentOptions: { label: string; value: string }[];
    onClose: () => void;
}

const CreatePanel: React.FC<CreatePanelProps> = ({ parentOptions, onClose }) => {
    const [form] = Form.useForm<CreateCategoryDTO>();
    const createCat = useCreateCategory();

    const handleCreate = async () => {
        const values = await form.validateFields();
        try {
            await createCat.mutateAsync(values);
            message.success('Category created');
            form.resetFields();
            onClose();
        } catch {
            message.error('Failed to create category');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0 }}>New Category</Title>
                <Button type="text" size="small" onClick={onClose} style={{ color: '#8c8c8c' }}>✕</Button>
            </div>
            <Form form={form} layout="vertical" size="small">
                <Form.Item label="Name (vi)" name={['name', 'vi']} rules={[{ required: true, message: 'Required' }]}>
                    <Input placeholder="Tên tiếng Việt" />
                </Form.Item>
                <Form.Item label="Name (en)" name={['name', 'en']}>
                    <Input placeholder="English name" />
                </Form.Item>
                <Form.Item label="Slug" name="slug">
                    <Input placeholder="auto-generated if empty" />
                </Form.Item>
                <Form.Item label="Parent Category" name="parentId">
                    <Select options={parentOptions} allowClear placeholder="Top-level" />
                </Form.Item>
                <Form.Item label="Order" name="order" initialValue={0}>
                    <Input type="number" />
                </Form.Item>
                <Form.Item label="Active" name="isActive" initialValue={true} valuePropName="checked">
                    <Switch />
                </Form.Item>
                <Divider />
                <Space>
                    <Button type="primary" icon={<CheckOutlined />} onClick={handleCreate} loading={createCat.isPending}>
                        Create
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </Space>
            </Form>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const CategoryTree: React.FC = () => {
    const { data: categories, isLoading } = useCategoryTree();
    const [selected, setSelected] = useState<Category | null>(null);
    const [creating, setCreating] = useState(false);

    const parentOptions = React.useMemo(
        () => (categories ? flattenTree(categories) : []),
        [categories],
    );

    const treeNodes = React.useMemo(
        () => (categories ? toTreeNodes(categories) : []),
        [categories],
    );

    // Find Category by id from tree
    const findById = (cats: Category[], id: string): Category | null => {
        for (const c of cats) {
            if (c.id === id) return c;
            if (c.children) {
                const found = findById(c.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const handleSelect = (_: React.Key[], { node }: { node: DataNode & { data?: Category } }) => {
        if (node.data) {
            setSelected(node.data);
            setCreating(false);
        }
    };

    const detailPanel = creating ? (
        <CreatePanel parentOptions={parentOptions} onClose={() => setCreating(false)} />
    ) : selected ? (
        <CatDetail
            cat={selected}
            parentOptions={parentOptions}
            onClose={() => setSelected(null)}
            onUpdated={(c) => setSelected(c)}
            onDeleted={() => setSelected(null)}
        />
    ) : null;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreating(true); setSelected(null); }}>
                    Add Category
                </Button>
            </div>
            <SplitLayout
                table={
                    <Spin spinning={isLoading}>
                        <Tree
                            treeData={treeNodes}
                            defaultExpandAll
                            showLine={{ showLeafIcon: false }}
                            onSelect={handleSelect as (keys: React.Key[], info: unknown) => void}
                            selectedKeys={selected ? [selected.id] : []}
                            style={{ background: '#fff', padding: 8, borderRadius: 8, minHeight: 300 }}
                        />
                    </Spin>
                }
                detail={detailPanel}
            />
        </div>
    );
};
