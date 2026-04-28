import React, { useState, memo, useCallback } from 'react';
import {
    Table,
    Tag,
    Space,
    Button,
    Input,
    Badge,
    Tooltip,
    Typography,
    message,
    Drawer,
    Descriptions,
    Divider,
    Card,
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EyeOutlined,
    GoldOutlined,
    StarFilled,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { productApi, ProductListItem, ProductDetail } from '@/entities/product/api/productApi';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';
import { CreateProductDrawer } from '@/features/product/create-product';

const { Text, Paragraph, Title } = Typography;

export const ProductCatalog: React.FC = memo(() => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language.split('-')[0];

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isCreateOpen, setCreateOpen] = useState(false);
    const { convertAndFormat } = useCurrencyConverter();

    const getName = useCallback(
        (name: Record<string, string> | null | undefined, fallback = '—') => {
            if (!name) return fallback;
            return name[currentLang] || name.en || name.vi || Object.values(name)[0] || fallback;
        },
        [currentLang]
    );

    const { data: products, isLoading } = useQuery({
        queryKey: ['pim-products', page, search],
        queryFn: () =>
            productApi.getProducts({
                page,
                limit: 15,
                search: search || undefined,
                sort: 'createdAt:desc',
                excludeCategoryId: '1f6c4798-c98b-46cd-a179-3c2945f04d7b',
            }),
    });

    const handleView = async (id: string) => {
        try {
            const detail = await productApi.getProduct(id);
            setSelectedProduct(detail);
            setDrawerOpen(true);
        } catch {
            message.error(t('common.error_boundary_title'));
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
                    <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded flex items-center justify-center">
                        <GoldOutlined className="text-gray-300" />
                    </div>
                );
            },
        },
        {
            title: t('products.catalog.table.piece'),
            key: 'name',
            render: (_: any, record: ProductListItem) => (
                <div>
                    <Text strong className="font-serif text-sm">
                        {getName(record.name)}
                    </Text>
                    <br />
                    <Text type="secondary" className="text-[10px] uppercase tracking-widest">
                        {record.slug}
                    </Text>
                </div>
            ),
        },
        {
            title: t('products.catalog.table.collection'),
            key: 'categories',
            render: (_: any, record: ProductListItem) => (
                <Space size={4} wrap>
                    {record.categories?.map(c => (
                        <Tag
                            key={c.categoryId}
                            className="text-[9px] uppercase tracking-widest m-0 border-gray-200 dark:border-gray-800"
                        >
                            {getName(c.category?.name)}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: t('products.catalog.table.material'),
            key: 'material',
            render: (_: any, record: ProductListItem) => {
                const tags = getMaterialTags(record);
                return (
                    <Space size={4} wrap>
                        {tags.map(t => (
                            <Tag key={t} color="gold" className="text-[9px] m-0">
                                <GoldOutlined className="mr-1" />
                                {t}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: t('products.catalog.table.variants'),
            key: 'variants',
            width: 80,
            render: (_: any, record: ProductListItem) => (
                <Tag className="rounded-none m-0 border-gray-200 dark:border-gray-800 text-[10px] font-bold">
                    {record.variants?.length || 0} SKU
                </Tag>
            ),
        },
        {
            title: t('products.catalog.table.valuation'),
            key: 'price',
            render: (_: any, record: ProductListItem) => {
                if (!record.displayPriceMin)
                    return <Text type="secondary">{t('products.catalog.table.bespoke')}</Text>;
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
            title: t('common.status'),
            key: 'status',
            width: 100,
            render: (_: any, record: ProductListItem) => (
                <Space size={4}>
                    <Badge status={record.isActive ? 'success' : 'default'} />
                    <Text className="text-[9px] uppercase tracking-widest font-bold text-gray-400">
                        {record.isActive ? t('inventory.status.active') : t('common.draft')}
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
                    placeholder={t('products.catalog.search')}
                    className="h-10 w-80 border-gray-100 bg-transparent rounded-none text-xs"
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    allowClear
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-10 px-6 bg-black border-none uppercase tracking-widest text-[9px] font-bold"
                    onClick={() => setCreateOpen(true)}
                >
                    {t('products.catalog.create')}
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
                    total: products?.meta?.totalItems || 0,
                    onChange: setPage,
                    showSizeChanger: false,
                    position: ['bottomCenter'],
                }}
                className="luxury-table"
            />

            <CreateProductDrawer open={isCreateOpen} onClose={() => setCreateOpen(false)} />

            <Drawer
                title={<Title level={4} className="!mb-0 font-serif">{getName(selectedProduct?.name)}</Title>}
                placement="right"
                width={800}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                className="luxury-drawer"
            >
                {selectedProduct && (
                    <div className="space-y-6">
                        <Descriptions title={t('products.catalog.drawer.identity')} bordered column={2} size="small">
                            <Descriptions.Item label="Slug">{selectedProduct.slug}</Descriptions.Item>
                            <Descriptions.Item label={t('common.status')}>
                                <Badge
                                    status={selectedProduct.isActive ? 'success' : 'default'}
                                    text={
                                        selectedProduct.isActive
                                            ? t('inventory.status.active')
                                            : t('common.draft')
                                    }
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label="Featured">
                                {selectedProduct.isFeatured ? <StarFilled className="text-amber-400" /> : 'No'}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('orders.drawer.date')}>
                                {new Date(selectedProduct.createdAt).toLocaleDateString()}
                            </Descriptions.Item>
                        </Descriptions>

                        {selectedProduct.description && (
                            <Card
                                size="small"
                                title={t('profile.bio')}
                                className="rounded-none border-gray-100 dark:border-gray-900 shadow-none"
                            >
                                <Paragraph className="text-xs text-gray-500">
                                    {getName(selectedProduct.description)}
                                </Paragraph>
                            </Card>
                        )}

                        <Divider
                            orientation="left"
                            className="!text-xs !uppercase !tracking-widest !text-gray-400"
                        >
                            {t('products.catalog.drawer.variants_count', {
                                count: selectedProduct.variants?.length || 0,
                            })}
                        </Divider>
                        <Table
                            dataSource={selectedProduct.variants || []}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            columns={[
                                {
                                    title: 'SKU',
                                    dataIndex: 'sku',
                                    render: (v: string) => <Text code className="text-[10px]">{v}</Text>,
                                },
                                {
                                    title: t('products.categories.name_en'),
                                    render: (_: any, r: any) => {
                                        const t = r.variantTitle;
                                        if (!t) return '—';
                                        if (t.materialType) return `${t.materialType} ${t.stoneType || ''}`.trim();
                                        return JSON.stringify(t);
                                    },
                                },
                                {
                                    title: t('products.catalog.table.valuation'),
                                    dataIndex: 'price',
                                    render: (v: number) => convertAndFormat(v),
                                },
                                {
                                    title: 'Cost',
                                    dataIndex: 'costPrice',
                                    render: (v: number) => convertAndFormat(v),
                                },
                                {
                                    title: 'Weight',
                                    dataIndex: 'weightGram',
                                    render: (v: number) => (v ? `${v}g` : '—'),
                                },
                                {
                                    title: 'Default',
                                    dataIndex: 'isDefault',
                                    render: (v: boolean) =>
                                        v ? <CheckCircleOutlined className="text-green-500" /> : null,
                                },
                            ]}
                        />

                        {selectedProduct.media && selectedProduct.media.length > 0 && (
                            <>
                                <Divider
                                    orientation="left"
                                    className="!text-xs !uppercase !tracking-widest !text-gray-400"
                                >
                                    {t('products.catalog.drawer.gallery')}
                                </Divider>
                                <div className="flex gap-3 flex-wrap">
                                    {selectedProduct.media.map(m => (
                                        <div key={m.id} className="relative">
                                            <img
                                                src={m.url}
                                                alt=""
                                                className="w-20 h-20 object-cover rounded border border-gray-100 dark:border-gray-900"
                                            />
                                            {m.isThumbnail && (
                                                <Tag color="gold" className="absolute top-1 left-1 text-[8px] m-0">
                                                    THUMB
                                                </Tag>
                                            )}
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
});
