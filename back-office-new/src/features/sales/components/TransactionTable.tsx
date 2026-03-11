import React from 'react';
import { Table, Tag, Typography, Tooltip, Space, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { PaymentTransaction } from '../types';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const { Text } = Typography;

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
    const columns: ColumnsType<PaymentTransaction> = [
        {
            title: 'Mã Giao dịch',
            dataIndex: 'transactionCode',
            key: 'transactionCode',
            render: (code, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: '13px' }}>{code || 'N/A'}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>ID: {record.id.slice(0, 8)}...</Text>
                </Space>
            ),
        },
        {
            title: 'Đơn hàng',
            dataIndex: ['order', 'code'],
            key: 'orderCode',
            render: (code) => (
                <Link to={`/orders?search=${code}`} className="text-blue-600 font-medium">
                    #{code}
                </Link>
            ),
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: (amount) => (
                <Text strong>{amount.toLocaleString()}đ</Text>
            ),
        },
        {
            title: 'Phương thức',
            key: 'method',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: '13px' }}>{record.provider}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{record.method || 'Default'}</Text>
                </Space>
            ),
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={type === 'payment' ? 'blue' : 'orange'}>
                    {type === 'payment' ? 'THANH TOÁN' : 'HOÀN TIỀN'}
                </Tag>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'success') color = 'green';
                if (status === 'failed') color = 'red';
                if (status === 'pending') color = 'processing';
                return <Tag color={color} bordered={false}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => (
                <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
                    <Text type="secondary">{dayjs(date).fromNow()}</Text>
                </Tooltip>
            ),
        },
    ];

    return (
        <Card className="shadow-sm border-none overflow-hidden" bodyStyle={{ padding: 0 }}>
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    onChange: onPageChange,
                    showSizeChanger: true,
                    className: 'p-4',
                }}
                className="rp-table"
            />
        </Card>
    );
};


