import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { GlassCard } from '@/shared/ui/GlassCard';

import { useOrders } from '@/entities/order/model/queries';
import type { Order } from '@/entities/order/model/types';

const columns: ColumnsType<Order> = [
    {
        title: 'Order ID',
        dataIndex: 'code',
        key: 'code',
        render: (text) => <a>#{text}</a>,
    },
    {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
    },
    {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date) => new Date(date).toLocaleString(),
    },
    {
        title: 'Amount',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        render: (amount) => `$${Number(amount).toFixed(2)}`,
    },
    {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        render: (status: string) => {
            let color = 'gold';
            if (status === 'delivered' || status === 'completed') {
                color = 'green';
            } else if (status === 'processing') {
                color = 'blue';
            } else if (status === 'cancelled') {
                color = 'red';
            }
            return (
                <Tag color={color}>
                    {status.toUpperCase()}
                </Tag>
            );
        },
    },
];

export const RecentOrders: React.FC = () => {
    const { data: orderData, isLoading } = useOrders({ page: 1, limit: 5 });

    return (
        <GlassCard title="Recent Orders" bordered={false} loading={isLoading}>
            <Table
                columns={columns}
                dataSource={orderData?.items || []}
                rowKey="id"
                pagination={false}
                size="middle"
            />
        </GlassCard>
    );
};
