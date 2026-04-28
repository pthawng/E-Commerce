import React from 'react';
import { Table, Tag, Space, Button, Input, Select, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { productApi, ProductListItem, ProductVariantSummary } from '@/entities/product/api/productApi';
import { EditOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';

const { Search } = Input;

export const ProductTable: React.FC = () => {
    const { t, i18n } = useTranslation() as any;
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['products', page, search],
        queryFn: () => productApi.getProducts({ page, limit: 10, search }),
    });

    const products = data?.items || [];
    const total = data?.meta?.totalItems || 0;

    const columns: ColumnsType<ProductListItem> = [
        {
            title: t('inventory.table.product', { defaultValue: 'Product' }),
            dataIndex: 'name',
            key: 'name',
            render: (name: Record<string, string>, record) => {
                const localizedName = i18n.language === 'vi' ? name?.vi : name?.en;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                            {record.media?.[0] ? (
                                <img src={record.media[0].url} alt={localizedName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] text-gray-300 uppercase">No Img</span>
                            )}
                        </div>
                        <div>
                            <div className="font-serif font-medium text-sm">{localizedName}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest">{record.id}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: t('inventory.table.category', { defaultValue: 'Category' }),
            dataIndex: 'categories',
            key: 'categories',
            render: (categories: any[]) => {
                const category = categories?.[0]?.category;
                const categoryName = i18n.language === 'vi' ? category?.name?.vi : category?.name?.en;
                return <span className="text-xs uppercase tracking-wider text-gray-500">{categoryName || 'N/A'}</span>;
            },
        },
        {
            title: t('inventory.table.variants', { defaultValue: 'Variants' }),
            dataIndex: 'variants',
            key: 'variants',
            render: (variants: ProductVariantSummary[]) => (
                <div className="flex flex-wrap gap-1">
                    {variants?.map(v => (
                        <Tag key={v.id} className="m-0 text-[10px] border-gray-100 bg-gray-50 text-gray-600">
                            {v.sku.split('-').pop()}
                        </Tag>
                    ))}
                </div>
            ),
        },
        {
            title: t('inventory.table.price', { defaultValue: 'Price' }),
            key: 'price',
            render: (_, record) => (
                <span className="font-medium text-sm">
                    {new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: i18n.language === 'vi' ? 'VND' : 'USD',
                    }).format(record.displayPriceMin || 0)}
                </span>
            ),
        },
        {
            title: t('inventory.table.status', { defaultValue: 'Status' }),
            key: 'status',
            render: (_, record) => (
                <Tag
                    color={record.isActive ? 'success' : 'default'}
                    className="rounded-none border-none text-[10px] uppercase font-bold px-2 py-0"
                >
                    {record.isActive
                        ? t('inventory.status.active', { defaultValue: 'Active' })
                        : t('inventory.status.draft', { defaultValue: 'Draft' })}
                </Tag>
            ),
        },
        {
            title: t('inventory.table.actions', { defaultValue: 'Actions' }),
            key: 'action',
            render: () => (
                <Space size="middle">
                    <Button type="text" icon={<EyeOutlined />} size="small" />
                    <Button type="text" icon={<EditOutlined />} size="small" />
                    <Button type="text" icon={<MoreOutlined />} size="small" />
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif mb-1">{t('inventory.title', { defaultValue: 'Inventory' })}</h2>
                    <p className="text-xs text-gray-400 italic">{t('inventory.subtitle', { defaultValue: 'Manage Stock' })}</p>
                </div>
                <Button
                    type="primary"
                    className="h-10 px-8 bg-black text-white hover:bg-gray-800 border-none uppercase tracking-widest text-[9px] font-bold"
                >
                    {t('inventory.add_product', { defaultValue: 'Add Product' })}
                </Button>
            </div>

            <div className="flex flex-wrap gap-4 items-center bg-gray-50/50 p-4 border border-gray-100">
                <Search
                    placeholder={t('inventory.search_placeholder', { defaultValue: 'Search...' })}
                    className="max-w-xs"
                    onSearch={v => setSearch(v)}
                    allowClear
                />
                <Select
                    placeholder={t('inventory.category', { defaultValue: 'Category' })}
                    className="w-32"
                    options={[
                        { label: 'Rings', value: 'rings' },
                        { label: 'Necklaces', value: 'necklaces' },
                        { label: 'Earrings', value: 'earrings' },
                    ]}
                />
                <div className="ml-auto text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                    {t('inventory.products_found', { defaultValue: 'Products Found: {{count}}', count: total })}
                </div>
            </div>

            {isLoading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                    pagination={{
                        current: page,
                        total: total,
                        pageSize: 10,
                        onChange: p => setPage(p),
                    }}
                    className="border border-gray-100"
                />
            )}
        </div>
    );
};
