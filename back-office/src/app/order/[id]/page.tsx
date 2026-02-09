import { useParams, useNavigate } from 'react-router-dom';
import { Descriptions, Table, Button, Alert, Modal, Form, Input, Spin } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useOrder, useOrderStatus, useCancelOrder } from '@/features/order/hooks/useOrders';
import { useState } from 'react';
import { StatusBadge, OrderTimeline } from '@/shared/ui';
import { createStatusStyle } from '@/ui/styles';

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

// Format time (seconds to MM:SS)
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [cancelModal, setCancelModal] = useState(false);

    const { data: order, isLoading } = useOrder(id!);
    const { data: status } = useOrderStatus(id!, {
        // Auto-refetch every 5s for pending_payment orders
        refetchInterval: order?.status === 'pending_payment' ? 5000 : false,
    });
    const cancelOrder = useCancelOrder();

    const handleCancelOrder = async () => {
        const values = await form.validateFields();
        if (id) {
            await cancelOrder.mutateAsync({
                id,
                reason: values.reason,
            });
            setCancelModal(false);
            form.resetFields();
            navigate('/orders');
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ padding: 24 }}>
                <Alert message="Order not found" type="error" />
            </div>
        );
    }

    const orderItemColumns = [
        {
            title: 'Product',
            key: 'product',
            render: (_: any, record: any) => (
                <div>
                    <div><strong>{record.variant.product.name}</strong></div>
                    <div style={{ fontSize: 12, color: '#888' }}>{record.variant.name}</div>
                </div>
            ),
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 150,
            render: (price: number) => formatCurrency(price),
        },
        {
            title: 'Subtotal',
            key: 'subtotal',
            width: 150,
            render: (_: any, record: any) => formatCurrency(record.price * record.quantity),
        },
    ];

    return (
        <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/orders')}
                    style={{ color: '#666', fontSize: 13 }}
                >
                    Orders
                </Button>

                {status?.canCancel && (
                    <Button
                        size="small"
                        onClick={() => setCancelModal(true)}
                        style={{
                            color: '#A85C5C',
                            borderColor: '#E5D5D5'
                        }}
                    >
                        Cancel order
                    </Button>
                )}
            </div>

            {/* Payment Deadline (Calm) */}
            {status && status.remainingSeconds !== null && status.remainingSeconds > 0 && (
                <div style={{
                    padding: 12,
                    backgroundColor: '#FBF9F5',
                    border: '1px solid #F0EBE3',
                    borderRadius: 4,
                    marginBottom: 20
                }}>
                    <div style={{
                        fontSize: 13,
                        color: '#8B7355',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <ClockCircleOutlined style={{ fontSize: 14 }} />
                        <span>Payment deadline: <strong>{formatTime(status.remainingSeconds)}</strong> remaining</span>
                    </div>
                </div>
            )}

            {/* Main Content Card */}
            <div style={{ backgroundColor: '#FFFFFF', padding: 24, borderRadius: 4, border: '1px solid #F0F0F0' }}>
                {/* Order Information */}
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', marginBottom: 16 }}>Order Information</h3>
                    <Descriptions
                        column={2}
                        colon={false}
                        bordered={false}
                        labelStyle={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#666',
                            paddingRight: 24,
                            paddingBottom: 12,
                            width: '140px'
                        }}
                        contentStyle={{
                            fontSize: 14,
                            color: '#1A1A1A',
                            paddingBottom: 12
                        }}
                    >
                        <Descriptions.Item label="Order Code" span={2}>
                            <code style={{ fontSize: 14, color: '#1A1A1A', backgroundColor: '#F8F8F8', padding: '2px 6px', borderRadius: 3 }}>{order.code}</code>
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <StatusBadge status={order.status as any} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Payment Method">
                            {order.paymentMethod}
                        </Descriptions.Item>
                        <Descriptions.Item label="Subtotal">
                            {formatCurrency(order.subTotal)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Shipping Fee">
                            {formatCurrency(order.shippingFee)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Amount" span={2}>
                            <strong style={{ fontSize: 16, color: '#1A1A1A' }}>
                                {formatCurrency(order.totalAmount)}
                            </strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Created At">
                            {formatDate(order.createdAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Updated At">
                            {formatDate(order.updatedAt)}
                        </Descriptions.Item>
                        {order.paymentDeadline && (
                            <Descriptions.Item label="Payment Deadline" span={2}>
                                {formatDate(order.paymentDeadline)}
                            </Descriptions.Item>
                        )}
                        {order.note && (
                            <Descriptions.Item label="Note" span={2}>
                                {order.note}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </div>

                {/* Order Timeline */}
                <div style={{ marginBottom: 32 }}>
                    <OrderTimeline currentStatus={order.status} />
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: '#F5F5F5', margin: '24px 0' }} />

                {/* Customer Information */}
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', marginBottom: 16 }}>Customer Information</h3>
                    <Descriptions
                        colon={false}
                        bordered={false}
                        labelStyle={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#666',
                            paddingRight: 24,
                            paddingBottom: 12,
                            width: '140px'
                        }}
                        contentStyle={{
                            fontSize: 14,
                            color: '#1A1A1A',
                            paddingBottom: 12
                        }}
                    >
                        <Descriptions.Item label="Email">
                            {order.user?.email || 'Guest'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Full Name">
                            {order.user?.fullName || 'N/A'}
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: '#F5F5F5', margin: '24px 0' }} />

                {/* Shipping Address */}
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', marginBottom: 16 }}>Shipping Address</h3>
                    <Descriptions
                        colon={false}
                        bordered={false}
                        labelStyle={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#666',
                            paddingRight: 24,
                            paddingBottom: 12,
                            width: '140px'
                        }}
                        contentStyle={{
                            fontSize: 14,
                            color: '#1A1A1A',
                            paddingBottom: 12
                        }}
                    >
                        {order.shippingAddress && typeof order.shippingAddress === 'object' && (
                            <>
                                <Descriptions.Item label="Recipient">
                                    {order.shippingAddress.fullName}
                                </Descriptions.Item>
                                <Descriptions.Item label="Phone">
                                    {order.shippingAddress.phone}
                                </Descriptions.Item>
                                <Descriptions.Item label="Address" span={2}>
                                    {order.shippingAddress.addressLine}, {order.shippingAddress.ward},{' '}
                                    {order.shippingAddress.district}, {order.shippingAddress.province}
                                </Descriptions.Item>
                            </>
                        )}
                    </Descriptions>
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: '#F5F5F5', margin: '24px 0' }} />

                {/* Order Items */}
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', marginBottom: 16 }}>Order Items</h3>
                    <Table
                        columns={orderItemColumns.map(col => ({
                            ...col,
                            title: <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>{col.title}</span>
                        }))}
                        dataSource={order.orderItems}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        bordered={false}
                        rowClassName="order-item-row"
                    />
                </div>

                {/* Inventory Reservation (Observability) */}
                {order.reservationId && (
                    <>
                        {/* Divider */}
                        <div style={{ height: 1, backgroundColor: '#F5F5F5', margin: '24px 0' }} />

                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', marginBottom: 16 }}>Inventory Reservation</h3>

                            {/* Calm informational block */}
                            <div style={{
                                padding: 12,
                                backgroundColor: '#F8F9FA',
                                borderRadius: 4,
                                marginBottom: 16
                            }}>
                                <div style={{
                                    fontSize: 12,
                                    color: '#666',
                                    lineHeight: 1.6
                                }}>
                                    Inventory reservations are managed automatically. Reservations auto-release after 15 minutes or when order is cancelled.
                                </div>
                            </div>

                            <Descriptions
                                colon={false}
                                bordered={false}
                                labelStyle={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: '#666',
                                    paddingRight: 24,
                                    paddingBottom: 12,
                                    width: '140px'
                                }}
                                contentStyle={{
                                    fontSize: 14,
                                    color: '#1A1A1A',
                                    paddingBottom: 12
                                }}
                            >
                                <Descriptions.Item label="Reservation ID" span={2}>
                                    <code style={{ fontSize: 13, color: '#666', backgroundColor: '#F8F8F8', padding: '2px 6px', borderRadius: 3 }}>{order.reservationId}</code>
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    {(() => {
                                        const isActive = order.status === 'pending_payment';
                                        const isConfirmed = ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status);
                                        const statusKey = isActive ? 'pending' : isConfirmed ? 'delivered' : 'cancelled';
                                        const label = isActive ? 'Active' : isConfirmed ? 'Confirmed' : 'Released';
                                        return (
                                            <span style={createStatusStyle(statusKey)}>
                                                {label}
                                            </span>
                                        );
                                    })()}
                                </Descriptions.Item>
                                <Descriptions.Item label="Expires At">
                                    {order.paymentDeadline ? formatDate(order.paymentDeadline) : 'N/A'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Items Reserved" span={2}>
                                    {order.orderItems.length} variant(s), {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} unit(s) total
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </>
                )}

            </div>

            {/* Cancel Order Modal */}
            <Modal
                title="Cancel Order"
                open={cancelModal}
                onOk={handleCancelOrder}
                onCancel={() => {
                    setCancelModal(false);
                    form.resetFields();
                }}
                confirmLoading={cancelOrder.isPending}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="reason"
                        label="Cancellation Reason"
                        rules={[{ required: true, message: 'Please provide a reason' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Enter reason for cancellation..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
