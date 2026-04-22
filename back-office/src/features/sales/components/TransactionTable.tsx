import React from 'react';
import type { PaymentTransaction } from '@/entities/sales/model/types';
import { LuxuryTable } from '@/shared/ui/DataTable';
import type { ColumnSchema } from '@/shared/ui/DataTable';
import { colors } from '@/shared/design-system/colors';

interface TransactionTableProps {
    data?: PaymentTransaction[];
    loading?: boolean;
    total?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number, pageSize: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
    data,
    loading,
    total,
    currentPage,
    pageSize,
    onPageChange,
}) => {
    const schema: ColumnSchema<PaymentTransaction>[] = [
        {
            title: 'Mã Giao dịch',
            key: 'transactionCode',
            type: 'id',
            width: 180,
        },
        {
            title: 'Đơn hàng',
            key: 'order.code',
            type: 'text',
            width: 140,
        },
        {
            title: 'Số tiền',
            key: 'amount',
            type: 'currency',
            width: 140,
            align: 'right',
        },
        {
            title: 'Phương thức',
            key: 'provider',
            type: 'text',
            width: 140,
        },
        {
            title: 'Loại',
            key: 'type',
            type: 'status-badge',
            width: 120,
            renderOptions: {
                statusMap: {
                    payment: { color: colors.info.main, bg: `${colors.info.main}12` },
                    refund: { color: colors.warning.main, bg: `${colors.warning.main}12` },
                }
            }
        },
        {
            title: 'Trạng thái',
            key: 'status',
            type: 'status-badge',
            width: 140,
            align: 'center',
            renderOptions: {
                statusMap: {
                    success: { color: colors.success.main, bg: `${colors.success.main}12` },
                    failed: { color: colors.error.main, bg: `${colors.error.main}12` },
                    pending: { color: colors.neutral[400], bg: `${colors.neutral[400]}12` },
                }
            }
        },
        {
            title: 'Thời gian',
            key: 'createdAt',
            type: 'date',
            width: 160,
        },
    ];

    return (
        <LuxuryTable<PaymentTransaction>
            schema={schema}
            dataSource={data}
            loading={loading}
            onPageChange={onPageChange}
            pagination={{
                total,
                current: currentPage,
                pageSize,
            }}
        />
    );
};


