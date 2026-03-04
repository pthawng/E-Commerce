import React from 'react';
import { Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface OrderType {
    key: string;
    orderId: string;
    customer: string;
    date: string;
    amount: number;
    status: string;
}

const recentOrders: OrderType[] = [
    { key: '1', orderId: '#ORD-001', customer: 'John Doe', date: '2026-03-04 10:30', amount: 154.50, status: 'Completed' },
    { key: '2', orderId: '#ORD-002', customer: 'Jane Smith', date: '2026-03-04 11:15', amount: 89.99, status: 'Processing' },
    { key: '3', orderId: '#ORD-003', customer: 'Alice Johnson', date: '2026-03-04 12:00', amount: 210.00, status: 'Pending' },
    { key: '4', orderId: '#ORD-004', customer: 'Robert Brown', date: '2026-03-04 13:45', amount: 45.00, status: 'Completed' },
    { key: '5', orderId: '#ORD-005', customer: 'Emma Davis', date: '2026-03-04 14:20', amount: 320.75, status: 'Processing' },
];

const columns: ColumnsType<OrderType> = [
    {
        title: 'Order ID',
        dataIndex: 'orderId',
        key: 'orderId',
        render: (text) => <a>{text}</a>,
    },
    {
        title: 'Customer',
        dataIndex: 'customer',
        key: 'customer',
    },
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount) => `$${amount.toFixed(2)}`,
    },
    {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        render: (_, { status }) => {
            let color = 'gold';
            if (status === 'Completed') {
                color = 'green';
            } else if (status === 'Processing') {
                color = 'blue';
            }
            return (
                <Tag color={color} key={status}>
                    {status.toUpperCase()}
                </Tag>
            );
        },
    },
];

export const RecentOrders: React.FC = () => {
    return (
        <Card title="Recent Orders" bordered={false}>
            <Table
                columns={columns}
                dataSource={recentOrders}
                pagination={false}
                size="middle"
            />
        </Card>
    );
};
