import React from 'react';
import type { Order } from '@/entities/order/model/types';
import { LuxuryTable } from '@/shared/ui/DataTable';
import type { ColumnSchema } from '@/shared/ui/DataTable';
import { colors } from '@/shared/design-system/colors';

interface OrderTableProps {
    data?: Order[];
    loading?: boolean;
    total?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange: (page: number, pageSize: number) => void;
    onRowClick: (order: Order) => void;
    selectedRowId?: string;
}

/**
 * OrderTable: Refactored to LuxuryTable (Schema-Driven)
 */
export const OrderTable: React.FC<OrderTableProps> = ({
    data,
    loading,
    total,
    currentPage,
    pageSize,
    onPageChange,
    onRowClick,
    selectedRowId,
}) => {
    const schema: ColumnSchema<Order>[] = [
        {
            title: 'Order ID',
            key: 'code',
            type: 'id',
            width: 140,
        },
        {
            title: 'Customer',
            key: 'shippingAddress.fullName', // In a real system, we'd handle nested keys
            type: 'text',
            width: 220,
        },
        {
            title: 'Date',
            key: 'createdAt',
            type: 'date',
            width: 160,
            sorter: true,
        },
        {
            title: 'Amount',
            key: 'totalAmount',
            type: 'currency',
            width: 150,
            align: 'right',
            sorter: true,
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
        <LuxuryTable<Order>
            schema={schema}
            dataSource={data}
            loading={loading}
            selectedRowId={selectedRowId}
            onRowClick={onRowClick}
            onPageChange={onPageChange}
            pagination={{
                total,
                current: currentPage,
                pageSize,
            }}
        />
    );
};
