import React from 'react';
import { GlassCard } from '@/shared/ui/GlassCard';
import { useRecentOrders } from '@/entities/dashboard/model/queries';
import type { Order } from '@/entities/order/model/types';
import { LuxuryTable } from '@/shared/ui/DataTable';
import type { ColumnSchema } from '@/shared/ui/DataTable';
import { colors } from '@/shared/design-system/colors';

export const RecentOrders: React.FC<{ hideTitle?: boolean }> = ({ hideTitle }) => {
    const { data: orders, isLoading } = useRecentOrders(5);

    const formattedOrders = (orders || []).map(o => ({
        ...o,
        customerName: o.user?.fullName || 'Guest Customer'
    }));

    const schema: ColumnSchema<Order>[] = [
        {
            title: 'Order ID',
            key: 'code',
            type: 'id',
            width: 200, // Increased to prevent wrapping
        },
        {
            title: 'Customer',
            key: 'customerName' as keyof Order,
            type: 'text',
            width: 220, // Added explicit width
        },
        {
            title: 'Date',
            key: 'createdAt',
            type: 'date',
            width: 180,
        },
        {
            title: 'Amount',
            key: 'totalAmount',
            type: 'currency',
            width: 140,
            align: 'right',
        },
        {
            title: 'Status',
            key: 'status',
            type: 'status-badge',
            width: 140,
            align: 'center',
            renderOptions: {
                statusMap: {
                    PENDING: { color: colors.warning.main, bg: `${colors.warning.main}12` },
                    CONFIRMED: { color: colors.warning.main, bg: `${colors.warning.main}12` },
                    PROCESSING: { color: colors.warning.main, bg: `${colors.warning.main}12` },
                    SHIPPING: { color: colors.info.main, bg: `${colors.info.main}12` },
                    DELIVERED: { color: colors.success.main, bg: `${colors.success.main}12` },
                    COMPLETED: { color: colors.success.main, bg: `${colors.success.main}12` },
                    CANCELLED: { color: colors.error.main, bg: `${colors.error.main}12` },
                }
            }
        },
    ];

    return (
        <GlassCard title={hideTitle ? undefined : "Recent Transactions"} variant="borderless" loading={isLoading}>
            <LuxuryTable<Order>
                schema={schema}
                dataSource={formattedOrders}
                rowKey="id"
                pagination={false}
                size="small"
            />
        </GlassCard>
    );
};
