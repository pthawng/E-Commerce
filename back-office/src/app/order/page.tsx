import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Space, Button, Input, Select, Card, Modal, Form } from 'antd';
import { SearchOutlined, EyeOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useOrders, useCancelOrder } from '@/features/order/hooks/useOrders';
import type { Order } from '@/features/order/api/orders.api';

const { Search } = Input;

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

export default function OrderListPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        status: undefined as string | undefined,
        search: undefined as string | undefined,
    });

    const { data, isLoading } = useOrders(filters);
    const cancelOrder = useCancelOrder();

    const [cancelModal, setCancelModal] = useState<{ visible: boolean; orderId?: string }>({
        visible: false,
    });
    const [form] = Form.useForm();

    const handleCancelOrder = async () => {
        const values = await form.validateFields();
        if (cancelModal.orderId) {
            await cancelOrder.mutateAsync({
                id: cancelModal.orderId,
                reason: values.reason,
            });
            setCancelModal({ visible: false });
            form.resetFields();
        }
    };

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
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: string) => (
                <Tag color={statusColors[status]}>{status.replace('_', ' ').toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Payment Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: 120,
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 150,
            render: (amount: number) => formatCurrency(amount),
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
            width: 150,
            fixed: 'right' as const,
            render: (_: any, record: Order) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/orders/${record.id}`)}
                    >
                        View
                    </Button>
                    {record.status === 'pending_payment' && (
                        <Button
                            type="link"
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => setCancelModal({ visible: true, orderId: record.id })}
                        >
                            Cancel
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card title="Orders Management">
                <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                        <Search
                            placeholder="Search by order code"
                            allowClear
                            onSearch={(value) => setFilters({ ...filters, search: value || undefined, page: 1 })}
                            style={{ width: 250 }}
                            prefix={<SearchOutlined />}
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
                                { label: 'Processing', value: 'processing' },
                                { label: 'Shipped', value: 'shipped' },
                                { label: 'Delivered', value: 'delivered' },
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
                    pagination={{
                        current: filters.page,
                        pageSize: filters.limit,
                        total: data?.meta?.total || 0,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} orders`,
                        onChange: (page, pageSize) => {
                            setFilters({ ...filters, page, limit: pageSize });
                        },
                    }}
                />
            </Card>

            {/* Cancel Order Modal */}
            <Modal
                title="Cancel Order"
                open={cancelModal.visible}
                onOk={handleCancelOrder}
                onCancel={() => {
                    setCancelModal({ visible: false });
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
