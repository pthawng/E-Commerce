import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Space, Button, Alert, Modal, Form, Input, Spin } from 'antd';
import { ArrowLeftOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useOrder, useOrderStatus, useCancelOrder } from '@/features/order/hooks/useOrders';
import { useState } from 'react';

// Status color mapping
const statusColors: Record<string, string> = {
    pending_payment: 'orange',
    confirmed: 'blue',
    processing: 'cyan',
    shipped: 'purple',
    delivered: 'green',
    cancelled: 'red',
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
        <div style={{ padding: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Header */}
                <div>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
                        Back to Orders
                    </Button>
                </div>

                {/* Payment Deadline Alert */}
                {status && status.remainingSeconds !== null && status.remainingSeconds > 0 && (
                    <Alert
                        message={
                            <Space>
                                <ClockCircleOutlined />
                                <span>
                                    Payment deadline: <strong>{formatTime(status.remainingSeconds)}</strong> remaining
                                </span>
                            </Space>
                        }
                        type="warning"
                        showIcon
                    />
                )}

                {/* Order Information */}
                <Card title="Order Information">
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="Order Code" span={2}>
                            <strong>{order.code}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color={statusColors[order.status]}>
                                {order.status.replace('_', ' ').toUpperCase()}
                            </Tag>
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
                            <strong style={{ fontSize: 18, color: '#1890ff' }}>
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
                </Card>

                {/* Customer Information */}
                <Card title="Customer Information">
                    <Descriptions bordered>
                        <Descriptions.Item label="Email">
                            {order.user?.email || 'Guest'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Full Name">
                            {order.user?.fullName || 'N/A'}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* Shipping Address */}
                <Card title="Shipping Address">
                    <Descriptions bordered>
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
                </Card>

                {/* Order Items */}
                <Card title="Order Items">
                    <Table
                        columns={orderItemColumns}
                        dataSource={order.orderItems}
                        rowKey="id"
                        pagination={false}
                    />
                </Card>

                {/* Inventory Reservation (Observability) */}
                {order.reservationId && (
                    <Card title="Inventory Reservation">
                        <Alert
                            message="Automatic Inventory Management"
                            description="Inventory reservations are handled automatically by backend jobs. Reservations are auto-released when orders are cancelled or payment expires (15 minutes). No manual intervention needed."
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <Descriptions bordered>
                            <Descriptions.Item label="Reservation ID" span={2}>
                                <code>{order.reservationId}</code>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={order.status === 'pending_payment' ? 'orange' : order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'green' : 'red'}>
                                    {order.status === 'pending_payment' ? 'ACTIVE' : order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'CONFIRMED' : 'RELEASED'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Expires At">
                                {order.paymentDeadline ? formatDate(order.paymentDeadline) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Items Reserved" span={2}>
                                {order.orderItems.length} variant(s), {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} unit(s) total
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}

                {/* Actions */}
                {status?.canCancel && (
                    <Card>
                        <Space>
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => setCancelModal(true)}
                            >
                                Cancel Order
                            </Button>
                        </Space>
                    </Card>
                )}
            </Space>

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
