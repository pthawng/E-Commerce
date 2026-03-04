import React from 'react';
import { Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface LowStockType {
    key: string;
    product: string;
    sku: string;
    stock: number;
    threshold: number;
}

const lowStockData: LowStockType[] = [
    { key: '1', product: 'Classic Gold Chain', sku: 'CGC-001', stock: 2, threshold: 5 },
    { key: '2', product: 'Silver Charm Bracelet', sku: 'SCB-002', stock: 0, threshold: 10 },
    { key: '3', product: 'Ruby Pendant', sku: 'RP-003', stock: 1, threshold: 3 },
    { key: '4', product: 'Sapphire Ring Size 7', sku: 'SR-007', stock: 3, threshold: 5 },
];

const columns: ColumnsType<LowStockType> = [
    {
        title: 'Product',
        dataIndex: 'product',
        key: 'product',
    },
    {
        title: 'SKU',
        dataIndex: 'sku',
        key: 'sku',
        render: (sku) => <Text type="secondary">{sku}</Text>
    },
    {
        title: 'Stock',
        key: 'stock',
        render: (_, record) => {
            const isOutOfStock = record.stock === 0;
            return (
                <Tag color={isOutOfStock ? 'red' : 'warning'}>
                    {record.stock} left (Min: {record.threshold})
                </Tag>
            );
        },
    },
];

import { Typography } from 'antd';
const { Text } = Typography;

export const LowStockAlerts: React.FC = () => {
    return (
        <Card title="Low Stock Alerts" bordered={false}>
            <Table
                columns={columns}
                dataSource={lowStockData}
                pagination={false}
                size="middle"
            />
        </Card>
    );
};
