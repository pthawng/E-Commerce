import React from 'react';
import {
    Button, Image, Typography, Descriptions, Space,
    Popconfirm, Switch, message, Badge, Tag,
} from 'antd';
import {
    EditOutlined,
} from '@ant-design/icons';
import { useUpdateProduct } from '@/entities/product/model/mutations';
import type { Product, Multilingual } from '@ecommerce/shared';
import { colors } from '@/shared/design-system/colors';

const { Title, Text } = Typography;

// Helper: get display name (vi first, then en)
const displayName = (name: Multilingual | undefined) =>
    name?.vi ?? name?.en ?? '—';

interface ProductDetailProps {
    product: Product;
    onClose: () => void;
    onEdit: (p: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose, onEdit }) => {
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
                    <Title level={5} style={{ margin: 0, color: colors.primary.main }}>{displayName(product.name)}</Title>
                    <code style={{ color: colors.neutral[500], fontSize: 12 }}>{product.slug}</code>
                </div>
                <Button type="text" size="small" onClick={onClose} style={{ color: colors.neutral[400], marginLeft: 8 }}>✕</Button>
            </div>

            {/* Actions */}
            <Space style={{ marginBottom: 20 }}>
                <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(product)}>Edit Details</Button>
            </Space>

            {/* Thumbnail */}
            {product.media && product.media.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <Image.PreviewGroup>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {product.media.slice(0, 4).map((m) => (
                                <Image key={m.id} src={m.url} width={80} height={80} style={{ objectFit: 'cover', borderRadius: '4px', border: `1px solid ${colors.neutral[100]}` }} />
                            ))}
                        </div>
                    </Image.PreviewGroup>
                </div>
            )}

            {/* Details */}
            <Descriptions column={1} size="small" bordered className="luxury-descriptions">
                <Descriptions.Item label="Name (vi)">{product.name.vi ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Name (en)">{product.name.en ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Category ID">{product.categoryId ?? <Text type="secondary">—</Text>}</Descriptions.Item>
                <Descriptions.Item label="Has Variants">
                    <Tag color={product.hasVariants ? 'blue' : 'default'}>{product.hasVariants ? 'Yes' : 'No'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Variants">
                    <Badge count={product.variants?.length ?? 0} showZero color={colors.secondary.main} />
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Switch
                            size="small"
                            checked={product.isActive}
                            loading={updateProduct.isPending}
                            onChange={() => toggleActive()}
                        />
                        <Text style={{ fontSize: '12px' }}>{product.isActive ? 'Active' : 'Inactive'}</Text>
                    </div>
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
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        {new Date(product.createdAt).toLocaleString()}
                    </Text>
                </Descriptions.Item>
            </Descriptions>
        </div>
    );
};
