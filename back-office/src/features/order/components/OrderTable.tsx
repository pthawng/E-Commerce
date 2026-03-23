import React from 'react';
import { Table, Tag, Typography, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Order, OrderStatus, PaymentStatus } from '@/entities/order/model/types';
import { OrderStatus as OrderStatusEnum, PaymentStatus as PaymentStatusEnum } from '@/entities/order/model/types';
import dayjs from 'dayjs';

const { Text } = Typography;

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
    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatusEnum.PENDING: return 'orange';
            case OrderStatusEnum.CONFIRMED: return 'cyan';
            case OrderStatusEnum.PROCESSING: return 'blue';
            case OrderStatusEnum.SHIPPING: return 'purple';
            case OrderStatusEnum.DELIVERED: return 'green';
            case OrderStatusEnum.COMPLETED: return 'success';
            case OrderStatusEnum.CANCELLED: return 'error';
            case OrderStatusEnum.RETURNED: return 'magenta';
            case OrderStatusEnum.REFUNDED: return 'volcano';
            default: return 'default';
        }
    };

    const getPaymentStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatusEnum.PAID: return 'green';
            case PaymentStatusEnum.UNPAID: return 'orange';
            case PaymentStatusEnum.REFUNDED: return 'error';
            default: return 'default';
        }
    };

    const columns: ColumnsType<Order> = [
        {
            title: 'Mã đơn',
            dataIndex: 'code',
            key: 'code',
            width: 140,
            render: (code: string) => <Text strong className="text-blue-600">{code}</Text>,
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.shippingAddress.fullName}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.user?.email || 'Khách vãng lai'}</Text>
                </Space>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
            sorter: true,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 150,
            align: 'right',
            render: (amount: number) => (
                <Text strong>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
                </Text>
            ),
            sorter: true,
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 240,
            render: (_, record) => (
                <Space size="middle">
                    <Tag bordered={false}>{record.paymentMethod}</Tag>
                    <Tag color={getPaymentStatusColor(record.paymentStatus)} bordered={false}>
                        {record.paymentStatus.toUpperCase()}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            align: 'center',
            render: (status: OrderStatus) => (
                <Tag color={getStatusColor(status)} bordered={false} className="px-3 rounded-full">
                    {status.toUpperCase().replace('_', ' ')}
                </Tag>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="id"
            onRow={(record) => ({
                onClick: () => onRowClick(record),
                className: `cursor-pointer transition-colors hover:bg-blue-50 ${selectedRowId === record.id ? 'bg-blue-50' : ''}`,
            })}
            pagination={{
                total,
                current: currentPage,
                pageSize,
                showSizeChanger: true,
                onChange: onPageChange,
                position: ['bottomRight'],
            }}
            scroll={{ x: 'max-content' }}
            className="shadow-sm border rounded-lg overflow-hidden border-0"
        />
    );
};
