import React, { useState } from 'react';
import { Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SplitLayout } from '@/shared/ui/SplitLayout';
import { useProducts } from '@/entities/product/model/queries';
import { useUrlFilters } from '@/shared/hooks/useUrlFilters';
import { LuxuryTable } from '@/shared/ui/DataTable';
import type { ColumnSchema } from '@/shared/ui/DataTable';
import type { Product } from '@ecommerce/shared';
import { colors } from '@/shared/design-system/colors';

// Internal detail component
import { ProductDetail } from './ProductDetail.tsx';

// ─── Main Table ───────────────────────────────────────────────────────────────
export const ProductTable: React.FC = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useUrlFilters({ page: 1, limit: 10, search: '' });
    const { data, isLoading } = useProducts(filters);
    const [selected, setSelected] = useState<Product | null>(null);

    const schema: ColumnSchema<Product>[] = [
        {
            title: 'Product',
            key: 'name',
            type: 'thumbnail-info',
            renderOptions: {
                imageKey: 'media.0.url',
                subKey: 'slug',
            }
        },
        {
            title: 'Price Range',
            key: 'displayPriceMin',
            type: 'currency-range',
            width: 160,
            renderOptions: {
                minKey: 'displayPriceMin',
                maxKey: 'displayPriceMax',
            }
        },
        {
            title: 'Status',
            key: 'isActive',
            type: 'status-badge',
            width: 90,
            renderOptions: {
                statusMap: {
                    true: { color: colors.success.main, bg: `${colors.success.main}12` },
                    false: { color: colors.neutral[400], bg: `${colors.neutral[400]}12` },
                }
            }
        },
        {
            title: 'Featured',
            key: 'isFeatured',
            type: 'featured',
            width: 80,
        },
    ];

    return (
        <div className="product-management">
            <div style={{ marginBottom: 24 }}>
                <Input.Search
                    placeholder="Search premium products..."
                    allowClear
                    value={filters.search}
                    onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
                    onSearch={(v) => setFilters({ search: v, page: 1 })}
                    style={{ width: 320 }}
                    size="large"
                    variant="filled"
                />
            </div>

            <SplitLayout
                table={
                    <LuxuryTable<Product>
                        schema={schema}
                        dataSource={data?.items ?? []}
                        loading={isLoading}
                        onRowClick={(r) => setSelected(r)}
                        selectedRowId={selected?.id}
                        pagination={{
                            current: filters.page,
                            pageSize: filters.limit,
                            total: data?.meta?.totalItems ?? 0,
                        }}
                        onPageChange={(p: number, l: number) => setFilters({ page: p, limit: l })}
                    />
                }
                detail={
                    selected ? (
                        <ProductDetail
                            product={selected}
                            onClose={() => setSelected(null)}
                            onEdit={(p: Product) => navigate(`/products/${p.id}/edit`)}
                        />
                    ) : null
                }
            />
        </div>
    );
};
