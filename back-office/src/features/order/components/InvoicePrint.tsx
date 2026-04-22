import React from 'react';
import { Typography, Divider, Table, Space } from 'antd';
import type { Order } from '@/entities/order/model/types';
import dayjs from 'dayjs';
import { colors } from '@/shared/design-system/colors';
import { typography } from '@/shared/design-system/typography';

const { Title, Text } = Typography;

interface InvoicePrintProps {
    order: Order;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({ order }) => {
    return (
        <div id="invoice-print-area" style={{
            padding: '40px',
            background: '#fff',
            color: '#000',
            fontFamily: 'Inter, sans-serif',
            maxWidth: '800px',
            margin: '0 auto',
            display: 'none', // Hidden by default, visible in print media
        }}>
            {/* Standard styles for printing */}
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    #invoice-print-area, #invoice-print-area * { visibility: visible; }
                    #invoice-print-area {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print { display: none !important; }
                }
                `}
            </style>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontFamily: typography.fontFamily.serif, color: colors.primary.main }}>
                        RAY PARADIS
                    </Title>
                    <Text style={{ fontSize: '12px', color: '#666' }}>High-Fidelity Luxury E-Commerce</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Title level={4} style={{ margin: 0 }}>INVOICE</Title>
                    <Text strong>#{order.code}</Text><br />
                    <Text style={{ fontSize: '12px' }}>{dayjs(order.createdAt).format('DD MMM, YYYY')}</Text>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                <div>
                    <Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Ship To:</Text><br />
                    <Text strong style={{ fontSize: '16px' }}>{order.shippingAddress.fullName}</Text><br />
                    <Text>{order.shippingAddress.phone}</Text><br />
                    <Text>{order.shippingAddress.address}, {order.shippingAddress.ward}</Text><br />
                    <Text>{order.shippingAddress.district}, {order.shippingAddress.city}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Payment Details:</Text><br />
                    <Text strong>{order.paymentMethod}</Text><br />
                    <Text>Status: {order.paymentStatus.toUpperCase()}</Text><br />
                    <Text>Currency: VND</Text>
                </div>
            </div>

            <Table
                dataSource={order.items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                    { title: 'ITEM', dataIndex: 'productName', key: 'productName' },
                    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
                    {
                        title: 'PRICE',
                        dataIndex: 'price',
                        key: 'price',
                        align: 'right',
                        render: (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
                    },
                    { title: 'QTY', dataIndex: 'quantity', key: 'quantity', align: 'center' },
                    {
                        title: 'TOTAL',
                        dataIndex: 'totalLine',
                        key: 'totalLine',
                        align: 'right',
                        render: (v) => <Text strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}</Text>
                    },
                ]}
            />

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <Space direction="vertical" align="end" size={4} style={{ width: '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Text>Subtotal</Text>
                        <Text>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subTotal)}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Text>Shipping</Text>
                        <Text>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shippingFee)}</Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Title level={4} style={{ margin: 0 }}>Total</Title>
                        <Title level={4} style={{ margin: 0 }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</Title>
                    </div>
                </Space>
            </div>

            <div style={{ marginTop: '80px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
                <Text style={{ fontSize: '11px', color: '#999' }}>
                    Thank you for choosing Ray Paradis Luxury Collection. For support, contact support@rayparadis.com
                </Text>
            </div>
        </div>
    );
};
