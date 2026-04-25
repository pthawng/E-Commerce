import React, { useState } from 'react';
import {
    Typography, Tabs, Table, Tag, Space, Button, Card, Row, Col, Statistic, Input,
    Badge, Tree, Modal, Form, Select, Switch, Drawer, Descriptions, Popconfirm,
    message, Tooltip, Collapse, Empty, Spin, InputNumber, Divider, Alert
} from 'antd';
import {
    PlusOutlined, SearchOutlined, EyeOutlined,
    DeleteOutlined, GoldOutlined, AppstoreOutlined,
    TagsOutlined, ExperimentOutlined, SafetyCertificateOutlined,
    BarChartOutlined, StarFilled, FolderOutlined, FolderOpenOutlined,
    WarningOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, ProductListItem, ProductDetail } from '../shared/api/productApi';
import { categoryApi, CategoryTreeNode, CreateCategoryPayload } from '../shared/api/categoryApi';
import { attributeApi, AttributeItem } from '../shared/api/attributeApi';
import api from '../shared/api/apiInstance';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';

const { Title, Text, Paragraph } = Typography;


// ============================================
// HELPER: get i18n display name
// ============================================
const getName = (name: Record<string, string> | null | undefined, fallback = '—') => {
    if (!name) return fallback;
    return name.vi || name.en || Object.values(name)[0] || fallback;
};

// Helper for i18n names removed (handled in columns)

// ============================================
// TAB 1: PRODUCT CATALOG
// ============================================
const ProductCatalogTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { convertAndFormat } = useCurrencyConverter();

    const { data: products, isLoading } = useQuery({
        queryKey: ['pim-products', page, search],
        queryFn: () => productApi.getProducts({ page, limit: 15, search: search || undefined, sort: 'createdAt:desc' }),
    });

    const { data: categories } = useQuery({
        queryKey: ['pim-categories-tree'],
        queryFn: () => categoryApi.getTree(true),
    });

    const handleView = async (id: string) => {
        try {
            const detail = await productApi.getProduct(id);
            setSelectedProduct(detail);
            setDrawerOpen(true);
        } catch {
            message.error('Không thể tải chi tiết sản phẩm');
        }
    };

    const getThumbnail = (item: ProductListItem) => {
        const thumb = item.media?.find(m => m.isThumbnail) || item.media?.[0];
        return thumb?.url;
    };

    const getMaterialTags = (item: ProductListItem) => {
        const tags: string[] = [];
        if (item.variants?.length) {
            item.variants.forEach(v => {
                if (v.variantTitle && typeof v.variantTitle === 'object') {
                    if (v.variantTitle.materialType) tags.push(v.variantTitle.materialType);
                    if (v.variantTitle.stoneType && v.variantTitle.stoneType !== 'NONE') {
                        tags.push(v.variantTitle.stoneType);
                    }
                }
            });
        }
        return [...new Set(tags)];
    };

    const columns = [
        {
            title: '',
            key: 'thumb',
            width: 60,
            render: (_: any, record: ProductListItem) => {
                const url = getThumbnail(record);
                return url ? (
                    <img src={url} alt="" className="w-10 h-10 object-cover rounded" />
                ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <GoldOutlined className="text-gray-300" />
                    </div>
                );
            },
        },
        {
            title: 'Piece',
            key: 'name',
            render: (_: any, record: ProductListItem) => (
                <div>
                    <Text strong className="font-serif text-sm">{getName(record.name)}</Text>
                    <br />
                    <Text type="secondary" className="text-[10px] uppercase tracking-widest">{record.slug}</Text>
                </div>
            ),
        },
        {
            title: 'Collection',
            key: 'categories',
            render: (_: any, record: ProductListItem) => (
                <Space size={4} wrap>
                    {record.categories?.map(c => (
                        <Tag key={c.categoryId} className="text-[9px] uppercase tracking-widest m-0 border-gray-200">
                            {getName(c.category?.name)}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Material',
            key: 'material',
            render: (_: any, record: ProductListItem) => {
                const tags = getMaterialTags(record);
                return (
                    <Space size={4} wrap>
                        {tags.map(t => (
                            <Tag key={t} color="gold" className="text-[9px] m-0">
                                <GoldOutlined className="mr-1" />{t}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Variants',
            key: 'variants',
            width: 80,
            render: (_: any, record: ProductListItem) => (
                <Tag className="rounded-none m-0 border-gray-200 text-[10px] font-bold">
                    {record.variants?.length || 0} SKU
                </Tag>
            ),
        },
        {
            title: 'Valuation',
            key: 'price',
            render: (_: any, record: ProductListItem) => {
                if (!record.displayPriceMin) return <Text type="secondary">Bespoke</Text>;
                const min = convertAndFormat(record.displayPriceMin || 0);
                const max = convertAndFormat(record.displayPriceMax || record.displayPriceMin || 0);
                return (
                    <Text className="font-serif font-medium text-xs">
                        {min === max ? min : `${min} — ${max}`}
                    </Text>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            width: 100,
            render: (_: any, record: ProductListItem) => (
                <Space size={4}>
                    <Badge status={record.isActive ? 'success' : 'default'} />
                    <Text className="text-[9px] uppercase tracking-widest font-bold text-gray-400">
                        {record.isActive ? 'Active' : 'Draft'}
                    </Text>
                    {record.isFeatured && (
                        <Tooltip title="Featured">
                            <StarFilled className="text-amber-400 text-xs" />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
        {
            title: '',
            key: 'actions',
            width: 80,
            render: (_: any, record: ProductListItem) => (
                <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record.id)} />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Input
                    prefix={<SearchOutlined className="text-gray-300" />}
                    placeholder="Search by name, SKU, or collection..."
                    className="h-10 w-80 border-gray-100 bg-transparent rounded-none"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    allowClear
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-10 px-6 bg-black border-none uppercase tracking-widest text-[9px] font-bold"
                >
                    Create Masterpiece
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={products?.items || []}
                loading={isLoading}
                rowKey="id"
                pagination={{
                    current: page,
                    pageSize: 15,
                    total: products?.meta?.total || 0,
                    onChange: setPage,
                    showSizeChanger: false,
                    position: ['bottomCenter'],
                }}
                className="luxury-table"
            />

            {/* Product Detail Drawer */}
            <Drawer
                title={<Title level={4} className="!mb-0 font-serif">{getName(selectedProduct?.name)}</Title>}
                placement="right"
                width={800}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                {selectedProduct && (
                    <div className="space-y-6">
                        <Descriptions title="Identity" bordered column={2} size="small">
                            <Descriptions.Item label="Slug">{selectedProduct.slug}</Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Badge status={selectedProduct.isActive ? 'success' : 'default'} text={selectedProduct.isActive ? 'Active' : 'Draft'} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Featured">
                                {selectedProduct.isFeatured ? <StarFilled className="text-amber-400" /> : 'No'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Created">{new Date(selectedProduct.createdAt).toLocaleDateString('vi-VN')}</Descriptions.Item>
                        </Descriptions>

                        {selectedProduct.description && (
                            <Card size="small" title="Description">
                                <Paragraph className="text-xs text-gray-500">{getName(selectedProduct.description)}</Paragraph>
                            </Card>
                        )}

                        <Divider orientation="left" className="!text-xs !uppercase !tracking-widest !text-gray-400">Variants ({selectedProduct.variants?.length || 0})</Divider>
                        <Table
                            dataSource={selectedProduct.variants || []}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            columns={[
                                { title: 'SKU', dataIndex: 'sku', render: (v: string) => <Text code className="text-[10px]">{v}</Text> },
                                {
                                    title: 'Title', render: (_: any, r: any) => {
                                        const t = r.variantTitle;
                                        if (!t) return '—';
                                        if (t.materialType) return `${t.materialType} ${t.stoneType || ''}`.trim();
                                        return JSON.stringify(t);
                                    }
                                },
                                { title: 'Price', dataIndex: 'price', render: (v: number) => convertAndFormat(v) },
                                { title: 'Cost', dataIndex: 'costPrice', render: (v: number) => convertAndFormat(v) },
                                { title: 'Weight', dataIndex: 'weightGram', render: (v: number) => v ? `${v}g` : '—' },
                                { title: 'Default', dataIndex: 'isDefault', render: (v: boolean) => v ? <CheckCircleOutlined className="text-green-500" /> : null },
                            ]}
                        />

                        {selectedProduct.media?.length > 0 && (
                            <>
                                <Divider orientation="left" className="!text-xs !uppercase !tracking-widest !text-gray-400">Media Gallery</Divider>
                                <div className="flex gap-3 flex-wrap">
                                    {selectedProduct.media.map(m => (
                                        <div key={m.id} className="relative">
                                            <img src={m.url} alt="" className="w-20 h-20 object-cover rounded border" />
                                            {m.isThumbnail && <Tag color="gold" className="absolute top-1 left-1 text-[8px] m-0">THUMB</Tag>}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
};

// ============================================
// TAB 2: COLLECTIONS & CATEGORIES
// ============================================
const CategoriesTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [form] = Form.useForm();

    const { data: tree, isLoading } = useQuery({
        queryKey: ['pim-categories-tree'],
        queryFn: () => categoryApi.getTree(true),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateCategoryPayload) => categoryApi.create(data),
        onSuccess: () => {
            message.success('Đã tạo danh mục');
            queryClient.invalidateQueries({ queryKey: ['pim-categories-tree'] });
            setCreateModalOpen(false);
            form.resetFields();
        },
        onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi tạo danh mục'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryApi.delete(id),
        onSuccess: () => {
            message.success('Đã xóa danh mục');
            queryClient.invalidateQueries({ queryKey: ['pim-categories-tree'] });
        },
    });

    const buildTreeData = (nodes: CategoryTreeNode[]): any[] => {
        return nodes.map(node => ({
            key: node.id,
            title: (
                <div className="flex items-center justify-between group w-full pr-4">
                    <Space size={8}>
                        <Text className="text-sm">{getName(node.name)}</Text>
                        {!node.isActive && <Tag color="default" className="text-[8px] m-0">Inactive</Tag>}
                        {node.path?.startsWith('collections') && <Tag color="purple" className="text-[8px] m-0">Collection</Tag>}
                    </Space>
                    <Space className="opacity-0 group-hover:opacity-100 transition-opacity" size={4}>
                        <Tooltip title="Thêm danh mục con">
                            <Button
                                type="text" size="small" icon={<PlusOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    form.setFieldsValue({ parentId: node.id });
                                    setCreateModalOpen(true);
                                }}
                            />
                        </Tooltip>
                        <Popconfirm
                            title="Xóa danh mục này?"
                            onConfirm={(e) => { e?.stopPropagation(); deleteMutation.mutate(node.id); }}
                            onCancel={(e) => e?.stopPropagation()}
                        >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
                        </Popconfirm>
                    </Space>
                </div>
            ),
            children: node.children?.length ? buildTreeData(node.children) : undefined,
            icon: node.children?.length ? <FolderOpenOutlined className="text-amber-500" /> : <FolderOutlined className="text-gray-300" />,
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Text className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                    Category Taxonomy & Collections
                </Text>
                <Button icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}
                    className="h-10 px-6 uppercase tracking-widest text-[9px] font-bold">
                    New Category
                </Button>
            </div>

            <Card className="shadow-sm">
                {isLoading ? <Spin className="w-full py-20" /> : (
                    tree && tree.length > 0 ? (
                        <Tree
                            showIcon
                            treeData={buildTreeData(tree)}
                            defaultExpandAll
                            className="bg-transparent"
                            blockNode
                        />
                    ) : (
                        <Empty description="No categories yet. Create one to get started." />
                    )
                )}
            </Card>

            <Modal
                title="Tạo danh mục mới"
                open={createModalOpen}
                onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending}
            >
                <Form form={form} layout="vertical" onFinish={(values) => {
                    createMutation.mutate({
                        name: { vi: values.nameVi, en: values.nameEn || '' },
                        parentId: values.parentId || undefined,
                        isActive: values.isActive ?? true,
                        order: values.order || 0,
                    });
                }}>
                    <Form.Item name="nameVi" label="Tên (Tiếng Việt)" rules={[{ required: true }]}>
                        <Input placeholder="Nhẫn cưới" />
                    </Form.Item>
                    <Form.Item name="nameEn" label="Name (English)">
                        <Input placeholder="Wedding Rings" />
                    </Form.Item>
                    <Form.Item name="parentId" label="Danh mục cha">
                        <Select allowClear placeholder="Chọn danh mục cha (bỏ trống = gốc)">
                            {tree?.map(c => <Select.Option key={c.id} value={c.id}>{getName(c.name)}</Select.Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="order" label="Thứ tự">
                                <InputNumber min={0} className="w-full" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked" initialValue={true}>
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

// ============================================
// TAB 3: ATTRIBUTE REGISTRY
// ============================================
const AttributeRegistryTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [form] = Form.useForm();

    const { data: attributes, isLoading } = useQuery({
        queryKey: ['pim-attributes'],
        queryFn: () => attributeApi.getAll(),
    });

    const seedMutation = useMutation({
        mutationFn: () => attributeApi.seedJewelryAttributes(),
        onSuccess: (results) => {
            if (results.length > 0) {
                message.success(`Đã tạo ${results.length} jewelry attributes`);
            } else {
                message.info('Tất cả jewelry attributes đã tồn tại');
            }
            queryClient.invalidateQueries({ queryKey: ['pim-attributes'] });
        },
        onError: () => message.error('Lỗi khi seed attributes'),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => attributeApi.create(data),
        onSuccess: () => {
            message.success('Đã tạo attribute');
            queryClient.invalidateQueries({ queryKey: ['pim-attributes'] });
            setCreateModalOpen(false);
            form.resetFields();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => attributeApi.delete(id),
        onSuccess: () => {
            message.success('Đã xóa attribute');
            queryClient.invalidateQueries({ queryKey: ['pim-attributes'] });
        },
    });

    const filterTypeBadge = (type: string) => {
        const map: Record<string, { color: string; label: string }> = {
            'select': { color: 'blue', label: 'SELECT' },
            'multiselect': { color: 'purple', label: 'MULTI' },
            'swatch_color': { color: 'gold', label: 'SWATCH' },
            'swatch_image': { color: 'orange', label: 'IMAGE' },
            'text': { color: 'default', label: 'TEXT' },
            'boolean': { color: 'green', label: 'BOOL' },
        };
        const info = map[type] || { color: 'default', label: type };
        return <Tag color={info.color} className="text-[8px] uppercase tracking-widest m-0">{info.label}</Tag>;
    };

    // Separate technical vs marketing
    const technicalCodes = ['material_type', 'stone_type', 'stone_clarity', 'stone_cut', 'certification', 'ring_size', 'material_purity'];
    const technical = attributes?.filter(a => technicalCodes.includes(a.code)) || [];
    const marketing = attributes?.filter(a => !technicalCodes.includes(a.code)) || [];

    const renderAttributeGroup = (title: string, icon: React.ReactNode, items: AttributeItem[]) => (
        <Card title={
            <Space>
                {icon}
                <Text className="text-xs uppercase tracking-widest font-bold">{title}</Text>
                <Tag className="text-[8px] m-0">{items.length}</Tag>
            </Space>
        } className="shadow-sm">
            {items.length === 0 ? (
                <Empty description="No attributes in this group" className="py-6" />
            ) : (
                <Collapse ghost expandIconPosition="start" items={items.map(attr => ({
                    key: attr.id,
                    label: (
                        <div className="flex items-center justify-between w-full pr-4">
                            <Space size={8}>
                                <Text strong className="text-sm">{getName(attr.name)}</Text>
                                <Text code className="text-[9px]">{attr.code}</Text>
                                {filterTypeBadge(attr.filterType)}
                            </Space>
                            <Space size={4}>
                                <Tag className="text-[8px] m-0">{attr.values?.length || 0} values</Tag>
                                <Popconfirm title="Xóa attribute này?" onConfirm={() => deleteMutation.mutate(attr.id)}>
                                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
                                </Popconfirm>
                            </Space>
                        </div>
                    ),
                    children: (
                        <div className="pl-6">
                            <div className="flex flex-wrap gap-2">
                                {attr.values?.map(v => (
                                    <Tag key={v.id} className="text-xs py-1 px-3 rounded-sm border-gray-200">
                                        {attr.filterType === 'swatch_color' && v.metaValue && (
                                            <span className="inline-block w-3 h-3 rounded-full mr-2 border" style={{ backgroundColor: v.metaValue }} />
                                        )}
                                        {getName(v.value)}
                                        {v.metaValue && <Text type="secondary" className="ml-2 text-[9px]">({v.metaValue})</Text>}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    ),
                }))} />
            )}
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Text className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                    Semantic Attribute Registry
                </Text>
                <Space>
                    <Button
                        icon={<ExperimentOutlined />}
                        onClick={() => seedMutation.mutate()}
                        loading={seedMutation.isPending}
                        className="h-10 px-6 uppercase tracking-widest text-[9px] font-bold"
                    >
                        Seed Jewelry Attributes
                    </Button>
                    <Button
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalOpen(true)}
                        className="h-10 px-6 uppercase tracking-widest text-[9px] font-bold"
                    >
                        New Attribute
                    </Button>
                </Space>
            </div>

            {isLoading ? <Spin className="w-full py-20" /> : (
                <div className="space-y-6">
                    {renderAttributeGroup('Technical Specifications', <SafetyCertificateOutlined className="text-blue-500" />, technical)}
                    {renderAttributeGroup('Marketing & Classification', <TagsOutlined className="text-purple-500" />, marketing)}
                </div>
            )}

            <Modal
                title="Tạo Attribute mới"
                open={createModalOpen}
                onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
                onOk={() => form.submit()}
                confirmLoading={createMutation.isPending}
            >
                <Form form={form} layout="vertical" onFinish={(values) => {
                    createMutation.mutate({
                        code: values.code,
                        name: { vi: values.nameVi, en: values.nameEn || '' },
                        filterType: values.filterType || 'select',
                    });
                }}>
                    <Form.Item name="code" label="Code" rules={[{ required: true }, { pattern: /^[a-z_]+$/, message: 'Lowercase + underscore only' }]}>
                        <Input placeholder="stone_color" />
                    </Form.Item>
                    <Form.Item name="nameVi" label="Tên (Tiếng Việt)" rules={[{ required: true }]}>
                        <Input placeholder="Màu đá" />
                    </Form.Item>
                    <Form.Item name="nameEn" label="Name (English)">
                        <Input placeholder="Stone Color" />
                    </Form.Item>
                    <Form.Item name="filterType" label="Filter Type" initialValue="select">
                        <Select>
                            <Select.Option value="select">Select</Select.Option>
                            <Select.Option value="multiselect">Multi-select</Select.Option>
                            <Select.Option value="swatch_color">Swatch (Color)</Select.Option>
                            <Select.Option value="swatch_image">Swatch (Image)</Select.Option>
                            <Select.Option value="text">Text</Select.Option>
                            <Select.Option value="boolean">Boolean</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// ============================================
// TAB 4: MATERIAL LEDGER LINK
// ============================================
const MaterialLedgerTab: React.FC = () => {
    const { convertAndFormat } = useCurrencyConverter();
    const { data: balances, isLoading } = useQuery({
        queryKey: ['ledger-balances'],
        queryFn: () => api.get('/ledger/balances').then(res => res.data),
    });

    const { data: kpis } = useQuery({
        queryKey: ['ledger-kpis'],
        queryFn: () => api.get('/ledger/kpis').then(res => res.data),
    });

    const materials = Array.isArray(balances) ? balances : [];

    const lowStockMaterials = materials.filter((m: any) => m.available <= 5);

    return (
        <div className="space-y-6">
            <Row gutter={16}>
                <Col span={8}>
                    <Card className="shadow-sm">
                        <Statistic
                            title={<Text className="text-[10px] uppercase tracking-widest">Total Material Value</Text>}
                            value={kpis?.totalMaterialValue || 0}
                            formatter={(v) => convertAndFormat(Number(v))}
                            prefix={<GoldOutlined className="text-amber-500" />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="shadow-sm">
                        <Statistic
                            title={<Text className="text-[10px] uppercase tracking-widest">Material SKUs</Text>}
                            value={materials.length}
                            prefix={<AppstoreOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="shadow-sm">
                        <Statistic
                            title={<Text className="text-[10px] uppercase tracking-widest">Low Stock Alerts</Text>}
                            value={lowStockMaterials.length}
                            valueStyle={{ color: lowStockMaterials.length > 0 ? '#ff4d4f' : '#52c41a' }}
                            prefix={<WarningOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {lowStockMaterials.length > 0 && (
                <Alert
                    type="warning"
                    showIcon
                    message="Low Stock Warnings"
                    description={
                        <div className="space-y-1 mt-2">
                            {lowStockMaterials.map((m: any) => (
                                <div key={m.id} className="text-xs">
                                    <Text strong>{getName(m.name)}</Text> ({m.sku}) — Available: <Text type="danger">{m.available}</Text>, Reserved: {m.reserved}
                                </div>
                            ))}
                        </div>
                    }
                />
            )}

            <Card title={
                <Space>
                    <BarChartOutlined />
                    <Text className="text-xs uppercase tracking-widest font-bold">Material Inventory</Text>
                </Space>
            } className="shadow-sm">
                <Table
                    dataSource={materials}
                    loading={isLoading}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 20 }}
                    columns={[
                        { title: 'SKU', dataIndex: 'sku', render: (v: string) => <Text code className="text-[10px]">{v}</Text> },
                        { title: 'Material', render: (_: any, r: any) => <Text className="font-serif">{getName(r.name)}</Text> },
                        {
                            title: 'Variant', dataIndex: 'variantTitle',
                            render: (v: any) => v ? <Text className="text-xs">{typeof v === 'object' ? JSON.stringify(v) : v}</Text> : '—'
                        },
                        { title: 'Warehouse', dataIndex: 'warehouse' },
                        { title: 'Qty', dataIndex: 'quantity', render: (v: number) => <Text strong>{v}</Text> },
                        {
                            title: 'Reserved', dataIndex: 'reserved',
                            render: (v: number) => <Text type={v > 0 ? 'warning' : 'secondary'}>{v}</Text>
                        },
                        {
                            title: 'Available', dataIndex: 'available',
                            render: (v: number) => <Text type={v <= 5 ? 'danger' : 'success'} strong>{v}</Text>
                        },
                        { title: 'Unit Cost', dataIndex: 'costPrice', render: (v: number) => convertAndFormat(v) },
                    ]}
                />
            </Card>
        </div>
    );
};

// ============================================
// MAIN PIM PAGE
// ============================================
export const PIMPage: React.FC = () => {
    usePageHeader({
        title: 'Catalog of Excellence',
        subtitle: 'Product Intelligence Management',
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Tabs */}
            <Tabs
                defaultActiveKey="catalog"
                className="luxury-tabs"
                items={[
                    {
                        key: 'catalog',
                        label: (
                            <Space size={6}>
                                <GoldOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Products</span>
                            </Space>
                        ),
                        children: <ProductCatalogTab />,
                    },
                    {
                        key: 'categories',
                        label: (
                            <Space size={6}>
                                <FolderOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Collections</span>
                            </Space>
                        ),
                        children: <CategoriesTab />,
                    },
                    {
                        key: 'attributes',
                        label: (
                            <Space size={6}>
                                <TagsOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Attributes</span>
                            </Space>
                        ),
                        children: <AttributeRegistryTab />,
                    },
                    {
                        key: 'ledger',
                        label: (
                            <Space size={6}>
                                <BarChartOutlined />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Material Ledger</span>
                            </Space>
                        ),
                        children: <MaterialLedgerTab />,
                    },
                ]}
            />
        </div>
    );
};

export default PIMPage;
