import React from 'react';
import type { Order } from '@/entities/order/model/types';
import { OrderStatus } from '@/entities/order/model/types';
import { LuxuryTable } from '@/shared/ui/DataTable';
import type { ColumnSchema, BulkAction } from '@/shared/ui/DataTable';
import { colors } from '@/shared/design-system/colors';
import { EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useBulkUpdateOrderStatus } from '@/entities/order/model/queries';

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
    const bulkMutation = useBulkUpdateOrderStatus();

    // FAANG L8: State-aware bulk actions
    const bulkActions: BulkAction<Order>[] = [
        {
            key: 'confirm',
            label: 'Bulk Confirm',
            onClick: (rows: Order[]) => {
                const pendingIds = rows
                    .filter(r => r.status === OrderStatus.PENDING)
                    .map(r => r.id);

                if (pendingIds.length > 0) {
                    bulkMutation.mutate({ ids: pendingIds, status: OrderStatus.CONFIRMED });
                }
            },
        },
        {
            key: 'print',
            label: 'Print Invoices',
            icon: <PrinterOutlined />,
            onClick: () => {
                // L8 Insight: In production, this would trigger a concatenated PDF generation
                window.print();
            },
        },
        {
            key: 'export',
            label: 'Export Data',
            onClick: (rows: Order[]) => {
                const csv = rows.map(r => `${r.code},${r.totalAmount},${r.status}`).join('\n');
                console.log('Exporting CSV:\n', csv);
            },
        }
    ];

    const getRowPriority = (order: Order) => {
        const isPending = order.status === OrderStatus.PENDING;
        const isOld = dayjs().diff(dayjs(order.createdAt), 'hour') > 24;

        if (isPending && isOld) return 'high';
        if (order.totalAmount > 5000000) return 'medium';
        return 'low';
    };

    const schema: ColumnSchema<Order>[] = [
        {
            title: 'Order ID',
            key: 'code',
            type: 'id',
            width: 120,
        },
        {
            title: 'Customer',
            key: 'shippingAddress.fullName',
            type: 'text',
            width: 200,
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
            width: 130,
            align: 'center',
            renderOptions: {
                statusMap: {
                    pending_payment: { color: colors.warning.main, bg: `${colors.warning.main}08`, border: `${colors.warning.main}20` },
                    pending: { color: colors.warning.main, bg: `${colors.warning.main}08`, border: `${colors.warning.main}20` },
                    confirmed: { color: colors.success.main, bg: `${colors.success.main}08`, border: `${colors.success.main}20` },
                    processing: { color: colors.info.main, bg: `${colors.info.main}08`, border: `${colors.info.main}20` },
                    shipping: { color: colors.info.main, bg: `${colors.info.main}08`, border: `${colors.info.main}20` },
                    delivered: { color: colors.success.main, bg: `${colors.success.main}08`, border: `${colors.success.main}20` },
                    completed: { color: colors.success.main, bg: `${colors.success.main}08`, border: `${colors.success.main}20` },
                    refunded: { color: colors.error.main, bg: `${colors.error.main}08`, border: `${colors.error.main}20` },
                    cancelled: { color: colors.error.main, bg: `${colors.error.main}08`, border: `${colors.error.main}20` },
                    returned: { color: colors.warning.main, bg: `${colors.warning.main}08`, border: `${colors.warning.main}20` },
                }
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            type: 'actions',
            width: 100,
            align: 'center',
            renderOptions: {
                actions: (record: Order) => [
                    {
                        key: 'view',
                        label: 'View',
                        icon: <EyeOutlined />,
                        onClick: () => onRowClick(record)
                    },
                    {
                        key: 'print',
                        label: 'Print',
                        icon: <PrinterOutlined />,
                        onClick: () => window.print()
                    }
                ]
            }
        }
    ];

    return (
        <LuxuryTable<Order>
            schema={schema}
            dataSource={data}
            loading={loading}
            selectedRowId={selectedRowId}
            onRowClick={onRowClick}
            onPageChange={onPageChange}
            bulkActions={bulkActions}
            getRowPriority={getRowPriority}
            pagination={{
                total,
                current: currentPage,
                pageSize,
            }}
        />
    );
};
