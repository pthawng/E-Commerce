import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Space, Button, Input, Select, Modal, Form, DatePicker, message } from 'antd';
import { DownloadOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useOrders, useCancelOrder } from '@/features/order/hooks/useOrders';
import type { Order } from '@/features/order/api/orders.api';
import { PageHeader, FilterBar, StatusBadge } from '@/shared/ui';
import { contentContainerStyle, cardStyle } from '@/ui/styles';
import * as tokens from '@/ui/design-tokens';

const { Search } = Input;
const { RangePicker } = DatePicker;

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
        dateFrom: undefined as string | undefined,
        dateTo: undefined as string | undefined,
    });

    const { data, isLoading } = useOrders(filters);
    const cancelOrder = useCancelOrder();

    // Bulk selection state
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

    // Quick filters
    const handleQuickFilter = (filterType: string) => {
        const now = new Date();
        let dateFrom: Date | undefined;

        switch (filterType) {
            case 'today':
                dateFrom = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                dateFrom = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                dateFrom = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'pending':
                setFilters({ ...filters, status: 'pending_payment', page: 1 });
                return;
            case 'clear':
                setFilters({ page: 1, limit: 10, status: undefined, search: undefined, dateFrom: undefined, dateTo: undefined });
                return;
        }

        if (dateFrom) {
            setFilters({ ...filters, dateFrom: dateFrom.toISOString(), page: 1 });
        }
    };

    // Bulk actions
    const handleBulkExport = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Please select orders to export');
            return;
        }
        message.success(`Exporting ${selectedRowKeys.length} orders...`);
        // TODO: Implement actual export logic
    };

    const handleBulkCancel = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Please select orders to cancel');
            return;
        }
        Modal.confirm({
            title: 'Cancel Selected Orders?',
            content: `Are you sure you want to cancel ${selectedRowKeys.length} orders?`,
            okText: 'Cancel Orders',
            okType: 'danger',
            onOk: () => {
                message.success(`Cancelling ${selectedRowKeys.length} orders...`);
                setSelectedRowKeys([]);
                // TODO: Implement actual bulk cancel logic
            },
        });
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
                <StatusBadge status={status as any} />
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
            width: 140,
            fixed: 'right' as const,
            render: (_: any, record: Order) => (
                <Space size={16}>
                    <Button
                        type="text"
                        size="small"
                        onClick={() => navigate(`/orders/${record.id}`)}
                        style={{ color: '#666', fontSize: 13 }}
                    >
                        View
                    </Button>
                    {record.status === 'pending_payment' && (
                        <Button
                            type="text"
                            size="small"
                            onClick={() => setCancelModal({ visible: true, orderId: record.id })}
                            style={{ color: '#A85C5C', fontSize: 13 }}
                        >
                            Cancel
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRowKeys(selectedKeys);
        },
    };

    return (
        <div>
            {/* Page Header */}
            <PageHeader
                title="Orders"
                subtitle={`${data?.meta?.total || 0} orders`}
                actions={
                    <>
                        <Button size="small" onClick={() => handleQuickFilter('clear')}>
                            Clear Filters
                        </Button>
                    </>
                }
            />

            {/* Quick Filters */}
            <div style={{
                padding: `${tokens.spacing.md}px ${tokens.spacing.xxl}px`,
                backgroundColor: tokens.neutral.background,
                borderBottom: `1px solid ${tokens.neutral.borderLight}`,
            }}>
                <div style={{
                    display: 'flex',
                    gap: tokens.spacing.sm,
                    maxWidth: 1400,
                    margin: '0 auto',
                    flexWrap: 'wrap',
                }}>
                    <span style={{ fontSize: 13, color: '#666', alignSelf: 'center', marginRight: 8 }}>Quick:</span>
                    <Button
                        size="small"
                        onClick={() => handleQuickFilter('today')}
                        style={{
                            fontSize: 12,
                            height: 28,
                            backgroundColor: filters.dateFrom ? '#F0F0F0' : 'transparent',
                        }}
                    >
                        Today
                    </Button>
                    <Button
                        size="small"
                        onClick={() => handleQuickFilter('week')}
                        style={{ fontSize: 12, height: 28 }}
                    >
                        This Week
                    </Button>
                    <Button
                        size="small"
                        onClick={() => handleQuickFilter('month')}
                        style={{ fontSize: 12, height: 28 }}
                    >
                        This Month
                    </Button>
                    <Button
                        size="small"
                        onClick={() => handleQuickFilter('pending')}
                        style={{
                            fontSize: 12,
                            height: 28,
                            backgroundColor: filters.status === 'pending_payment' ? '#F5F0E8' : 'transparent',
                            color: filters.status === 'pending_payment' ? '#8B7355' : undefined,
                        }}
                    >
                        Pending Payment
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <FilterBar>
                <Search
                    placeholder="Search by order code"
                    allowClear
                    onSearch={(value) => setFilters({ ...filters, search: value || undefined, page: 1 })}
                    style={{ width: 280 }}
                    size="middle"
                />
                <Select
                    placeholder="Status"
                    allowClear
                    style={{ width: 160 }}
                    size="middle"
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
                <RangePicker
                    size="middle"
                    style={{ width: 280 }}
                    onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                            setFilters({
                                ...filters,
                                dateFrom: dates[0].toISOString(),
                                dateTo: dates[1].toISOString(),
                                page: 1,
                            });
                        } else {
                            setFilters({ ...filters, dateFrom: undefined, dateTo: undefined, page: 1 });
                        }
                    }}
                />
            </FilterBar>

            {/* Bulk Action Bar */}
            {selectedRowKeys.length > 0 && (
                <div style={{
                    padding: `${tokens.spacing.md}px ${tokens.spacing.xxl}px`,
                    backgroundColor: '#EBF1F5',
                    borderBottom: `1px solid ${tokens.neutral.borderLight}`,
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        maxWidth: 1400,
                        margin: '0 auto',
                    }}>
                        <span style={{ fontSize: 13, color: '#5A7A8C', fontWeight: 500 }}>
                            {selectedRowKeys.length} order{selectedRowKeys.length > 1 ? 's' : ''} selected
                        </span>
                        <Space size={8}>
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={handleBulkExport}
                                style={{ fontSize: 12 }}
                            >
                                Export
                            </Button>
                            <Button
                                size="small"
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={handleBulkCancel}
                                style={{ fontSize: 12 }}
                            >
                                Cancel Orders
                            </Button>
                            <Button
                                size="small"
                                onClick={() => setSelectedRowKeys([])}
                                style={{ fontSize: 12 }}
                            >
                                Clear Selection
                            </Button>
                        </Space>
                    </div>
                </div>
            )}

            {/* Content */}
            <div style={contentContainerStyle}>
                <div style={cardStyle}>
                    <Table
                        rowSelection={rowSelection}
                        columns={columns.map(col => ({
                            ...col,
                            title: <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>{col.title}</span>
                        }))}
                        dataSource={data?.data}
                        loading={isLoading}
                        rowKey="id"
                        size="middle"
                        scroll={{ x: 1200 }}
                        bordered={false}
                        onRow={() => ({
                            style: { cursor: 'pointer', transition: 'background 0.15s ease' },
                            onMouseEnter: (e) => { e.currentTarget.style.background = '#FAFAFA'; },
                            onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
                        })}
                        locale={{
                            emptyText: (
                                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 14, color: '#999', marginBottom: 8 }}>No orders found</div>
                                    <div style={{ fontSize: 12, color: '#BBB' }}>
                                        {filters.search || filters.status ? 'Try adjusting filters' : 'Orders will appear here'}
                                    </div>
                                </div>
                            ),
                        }}
                        pagination={{
                            current: filters.page,
                            pageSize: filters.limit,
                            total: data?.meta?.total || 0,
                            showSizeChanger: true,
                            showTotal: (total) => `${total} total`,
                            onChange: (page, pageSize) => {
                                setFilters({ ...filters, page, limit: pageSize });
                            },
                        }}
                    />
                </div>
            </div>

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
