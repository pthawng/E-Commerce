import React, { useState } from 'react';
import {
    Table, Tag, Button, Image, Typography, Descriptions, Space,
    Popconfirm, Switch, message, Badge,
} from 'antd';
import {
    PlusOutlined, EditOutlined, PictureOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { SplitLayout } from '@/shared/ui/SplitLayout';
import { useProducts, useUpdateProduct } from '../hooks';
import type { Product } from '../types';

const { Title, Text } = Typography;

// Helper: get display name (vi first, then en)
const displayName = (name: Record<string, string> | undefined) =>
    name?.vi ?? name?.en ?? '—';

// ─── Detail Panel ─────────────────────────────────────────────────────────────
interface ProductDetailProps {
    product: Product;
    onClose: () => void;
    onEdit: (p: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose, onEdit }) => {
    const updateProduct = useUpdateProduct();

    const toggleActive = async () => {
        try {
            await updateProduct.mutateAsync({ id: product.id, data: { isActive: !product.isActive } });
            message.success(`Product ${product.isActive ? 'deactivated' : 'activated'}`);
        } catch {
            message.error('Failed to update status');
        }
    };

    const toggleFeatured = async () => {
        try {
            await updateProduct.mutateAsync({ id: product.id, data: { isFeatured: !product.isFeatured } });
            message.success(`Product ${product.isFeatured ? 'unfeatured' : 'featured'}`);
        } catch {
            message.error('Failed to update');
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Title level={5} style={{ margin: 0 }}>{displayName(product.name)}</Title>
                    <code style={{ color: '#8c8c8c', fontSize: 12 }}>{product.slug}</code>
                </div>
                <Button type="text" size="small" onClick={onClose} style={{ color: '#8c8c8c', marginLeft: 8 }}>✕</Button>
            </div>

            {/* Actions */}
            <Space style={{ marginBottom: 20 }}>
                <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(product)}>Edit</Button>
            </Space>

            {/* Thumbnail */}
            {product.media && product.media.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <Image.PreviewGroup>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {product.media.slice(0, 4).map((m) => (
                                <Image key={m.id} src={m.url} width={72} height={72} style={{ objectFit: 'cover', borderRadius: 4 }} />
                            ))}
                        </div>
                    </Image.PreviewGroup>
                </div>
            )}

            {/* Details */}
            <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Name (vi)">{product.name.vi ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Name (en)">{product.name.en ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Categories">
                    {product.categories?.map((c) => (
                        <Tag key={c.category.id}>{displayName(c.category.name)}</Tag>
                    )) ?? <Text type="secondary">—</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Has Variants">
                    <Tag color={product.hasVariants ? 'blue' : 'default'}>{product.hasVariants ? 'Yes' : 'No'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Variants">
                    <Badge count={product._count?.variants ?? product.variants?.length ?? 0} showZero color="#4096ff" />
                </Descriptions.Item>
                <Descriptions.Item label="Active">
                    <Popconfirm
                        title={`${product.isActive ? 'Deactivate' : 'Activate'} product?`}
                        onConfirm={toggleActive}
                        okText="Yes" cancelText="Cancel"
                    >
                        <Switch
                            size="small"
                            checked={product.isActive}
                            loading={updateProduct.isPending}
                        />
                    </Popconfirm>
                </Descriptions.Item>
                <Descriptions.Item label="Featured">
                    <Popconfirm
                        title={`${product.isFeatured ? 'Remove from featured?' : 'Mark as featured?'}`}
                        onConfirm={toggleFeatured}
                        okText="Yes" cancelText="Cancel"
                    >
                        <Switch size="small" checked={product.isFeatured} loading={updateProduct.isPending} />
                    </Popconfirm>
                </Descriptions.Item>
                <Descriptions.Item label="Created">
                    {new Date(product.createdAt).toLocaleString()}
                </Descriptions.Item>
            </Descriptions>
        </div>
    );
};

// ─── Main Table ───────────────────────────────────────────────────────────────
export const ProductTable: React.FC = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data, isLoading } = useProducts({ page, limit });
    const [selected, setSelected] = useState<Product | null>(null);

    const columns: ColumnsType<Product> = [
        {
            title: 'Product',
            key: 'product',
            render: (_, r) => (
                <Space>
                    {r.media?.[0] ? (
                        <img src={r.media[0].url} alt="" width={40} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                        <div style={{
                            width: 40, height: 40, background: '#f0f0f0', borderRadius: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <PictureOutlined style={{ color: '#bfbfbf' }} />
                        </div>
                    )}
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 13 }}>{displayName(r.name)}</Text>
                        <code style={{ fontSize: 11, color: '#8c8c8c' }}>{r.slug}</code>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Categories',
            key: 'categories',
            width: 140,
            render: (_, r) => (
                <>
                    {r.categories?.slice(0, 2).map((c) => (
                        <Tag key={c.category.id} style={{ fontSize: 11 }}>{displayName(c.category.name)}</Tag>
                    ))}
                    {(r.categories?.length ?? 0) > 2 && <Tag>+{(r.categories?.length ?? 0) - 2}</Tag>}
                </>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            width: 90,
            render: (_, r) => <Tag color={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Tag>,
        },
        {
            title: 'Featured',
            key: 'featured',
            width: 80,
            render: (_, r) => r.isFeatured ? <Tag color="gold">Featured</Tag> : null,
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/create')}>
                    Add Product
                </Button>
            </div>
            <SplitLayout
                table={
                    <Table
                        columns={columns}
                        dataSource={data?.items ?? []}
                        rowKey="id"
                        loading={isLoading}
                        size="middle"
                        pagination={{
                            current: page,
                            pageSize: limit,
                            total: data?.meta?.total ?? 0,
                            showSizeChanger: true,
                            showTotal: (t, r) => `${r[0]}-${r[1]} of ${t}`,
                            onChange: (p, l) => { setPage(p); setLimit(l); },
                        }}
                        onRow={(r) => ({
                            onClick: () => setSelected(r),
                            style: { cursor: 'pointer', background: selected?.id === r.id ? '#e6f4ff' : undefined },
                        })}
                    />
                }
                detail={
                    selected ? (
                        <ProductDetail
                            product={selected}
                            onClose={() => setSelected(null)}
                            onEdit={(p) => navigate(`/products/${p.id}/edit`)}
                        />
                    ) : null
                }
            />
        </div>
    );
};
