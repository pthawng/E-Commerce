import { useState } from 'react';
import { Table, Tag, Space, Button, Select, Card } from 'antd';
import { DollarOutlined, CheckCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { useOrders } from '@/features/order/hooks/useOrders';
import type { Order } from '@/features/order/api/orders.api';
import { RefundModal } from '@/features/payment/components/RefundModal';
import { CODConfirmModal } from '@/features/payment/components/CODConfirmModal';

// Payment status color mapping
const paymentStatusColors: Record<string, string> = {
    pending: 'orange',
    paid: 'green',
    failed: 'red',
    refunded: 'purple',
    partially_refunded: 'blue',
};

// Payment method color mapping
const paymentMethodColors: Record<string, string> = {
    COD: 'gold',
    VNPAY: 'blue',
    PAYPAL: 'cyan',
};

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
};

// Get payment status from order
const getPaymentStatus = (order: Order): string => {
    if (order.payment?.status) {
        return order.payment.status;
    }
    // Infer from order status
    if (order.status === 'pending_payment') return 'pending';
    if (order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') return 'paid';
    if (order.status === 'cancelled') return 'failed';
    return 'pending';
};

export default function PaymentListPage() {
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        paymentMethod: undefined as string | undefined,
        status: undefined as string | undefined,
    });

    const { data, isLoading } = useOrders(filters);

    const [refundModal, setRefundModal] = useState<{
        visible: boolean;
        orderId?: string;
        orderCode?: string;
        amount?: number;
    }>({ visible: false });

    const [codModal, setCodModal] = useState<{
        visible: boolean;
        orderId?: string;
        orderCode?: string;
        amount?: number;
    }>({ visible: false });

    const columns = [
        {
            title: 'Order Code',
            dataIndex: 'code',
            key: 'code',
            width: 150,
            render: (code: string) => <strong>{code}</strong>,
        },
        {
            title: 'Customer',
            key: 'customer',
            width: 200,
            render: (_: any, record: Order) => (
                <div>
                    {record.user?.email || 'Guest'}
                    {record.user?.fullName && <div style={{ fontSize: 12, color: '#888' }}>{record.user.fullName}</div>}
                </div>
            ),
        },
        {
            title: 'Payment Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: 130,
            render: (method: string) => (
                <Tag color={paymentMethodColors[method]}>{method}</Tag>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 150,
            render: (amount: number) => formatCurrency(amount),
        },
        {
            title: 'Payment Status',
            key: 'paymentStatus',
            width: 150,
            render: (_: any, record: Order) => {
                const status = getPaymentStatus(record);
                return (
                    <Tag color={paymentStatusColors[status]}>
                        {status.replace('_', ' ').toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (date: string) => formatDate(date),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200,
            fixed: 'right' as const,
            render: (_: any, record: Order) => {
                const paymentStatus = getPaymentStatus(record);
                const isPaid = paymentStatus === 'paid';
                const isPendingCOD = record.paymentMethod === 'COD' && paymentStatus === 'pending';

                return (
                    <Space>
                        {isPaid && (
                            <Button
                                type="link"
                                icon={<UndoOutlined />}
                                onClick={() =>
                                    setRefundModal({
                                        visible: true,
                                        orderId: record.id,
                                        orderCode: record.code,
                                        amount: record.totalAmount,
                                    })
                                }
                            >
                                Refund
                            </Button>
                        )}
                        {isPendingCOD && (
                            <Button
                                type="link"
                                icon={<CheckCircleOutlined />}
                                onClick={() =>
                                    setCodModal({
                                        visible: true,
                                        orderId: record.id,
                                        orderCode: record.code,
                                        amount: record.totalAmount,
                                    })
                                }
                            >
                                Confirm COD
                            </Button>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card title={<><DollarOutlined /> Payment Management</>}>
                <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                        <Select
                            placeholder="Filter by payment method"
                            allowClear
                            style={{ width: 200 }}
                            value={filters.paymentMethod}
                            onChange={(value) => setFilters({ ...filters, paymentMethod: value, page: 1 })}
                            options={[
                                { label: 'COD', value: 'COD' },
                                { label: 'VNPAY', value: 'VNPAY' },
                                { label: 'PayPal', value: 'PAYPAL' },
                            ]}
                        />
                        <Select
                            placeholder="Filter by status"
                            allowClear
                            style={{ width: 200 }}
                            value={filters.status}
                            onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
                            options={[
                                { label: 'Pending Payment', value: 'pending_payment' },
                                { label: 'Confirmed', value: 'confirmed' },
                                { label: 'Cancelled', value: 'cancelled' },
                            ]}
                        />
                    </Space>
                </Space>

                <Table
                    columns={columns}
                    dataSource={data?.data}
                    loading={isLoading}
                    rowKey="id"
                    scroll={{ x: 1200 }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '40px 0' }}>
                                <DollarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                                <div style={{ fontSize: 16, color: '#595959' }}>No payments found</div>
                                <div style={{ fontSize: 14, color: '#8c8c8c', marginTop: 8 }}>
                                    {filters.paymentMethod || filters.status ? 'Try adjusting your filters' : 'Payments will appear here once orders are placed'}
                                </div>
                            </div>
                        ),
                    }}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.limit,
                        total: data?.meta?.total || 0,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} payments`,
                        onChange: (page, pageSize) => {
                            setFilters({ ...filters, page, limit: pageSize });
                        },
                    }}
                />
            </Card>

            {/* Refund Modal */}
            {refundModal.visible && refundModal.orderId && (
                <RefundModal
                    visible={refundModal.visible}
                    orderId={refundModal.orderId}
                    orderCode={refundModal.orderCode!}
                    currentAmount={refundModal.amount!}
                    onClose={() => setRefundModal({ visible: false })}
                />
            )}

            {/* COD Confirm Modal */}
            {codModal.visible && codModal.orderId && (
                <CODConfirmModal
                    visible={codModal.visible}
                    orderId={codModal.orderId}
                    orderCode={codModal.orderCode!}
                    amount={codModal.amount!}
                    onClose={() => setCodModal({ visible: false })}
                />
            )}
        </div>
    );
}
