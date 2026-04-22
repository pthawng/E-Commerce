import React from 'react';
import { GlassCard } from '@/shared/ui/GlassCard';
import { useLowStockAlerts } from '@/entities/dashboard/model/queries';
import { LuxuryTable } from '@/shared/ui/DataTable';
import type { ColumnSchema } from '@/shared/ui/DataTable';
import { colors } from '@/shared/design-system/colors';

interface LowStockType {
    id: string;
    product: string;
    sku: string;
    stock: number;
    threshold: number;
    status: string;
}

export const LowStockAlerts: React.FC<{ hideTitle?: boolean }> = ({ hideTitle }) => {
    const { data: rawData, isLoading } = useLowStockAlerts(5);

    const dataSource: LowStockType[] = (rawData || []).map(item => ({
        id: item.id,
        product: item.productVariant.product.name.vi || 'N/A',
        sku: item.productVariant.sku,
        stock: item.quantity,
        status: item.quantity === 0 ? 'error' : 'warning',
        threshold: 10,
    }));

    const schema: ColumnSchema<LowStockType & { status: string }>[] = [
        {
            title: 'Product',
            key: 'product',
            type: 'text',
        },
        {
            title: 'SKU',
            key: 'sku',
            type: 'text',
        },
        {
            title: 'Stock Status',
            key: 'status',
            type: 'status-badge',
            renderOptions: {
                statusMap: {
                    error: {
                        color: colors.error.main,
                        bg: `${colors.error.main}12`,
                        label: 'Out of Stock'
                    } as any,
                    warning: {
                        color: colors.warning.main,
                        bg: `${colors.warning.main}12`,
                        label: 'Low Stock'
                    } as any
                }
            }
        }
    ];

    return (
        <GlassCard title={hideTitle ? undefined : "Low Stock Alerts"} variant="borderless" loading={isLoading}>
            <LuxuryTable<LowStockType & { status: string }>
                schema={schema}
                dataSource={dataSource}
                rowKey="id"
                pagination={false}
            />
        </GlassCard>
    );
};
