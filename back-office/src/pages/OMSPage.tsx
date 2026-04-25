import React, { useState } from 'react';
import {
    Typography,
    Table,
    Tag,
    Space,
    Button,
    Card,
    Row,
    Col,
    Statistic,
    Drawer,
    Descriptions,
    Divider,
    Timeline,
    message,
    Popconfirm,
    Tabs
} from 'antd';
import {
    ShoppingOutlined,
    LoadingOutlined,
    EyeOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, OrderListItem } from '../shared/api/orderApi';
import { ORDER_STATUS_CONFIG, VALID_TRANSITIONS, OrderStatusEnum } from '../shared/types/order.types';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';

const { Title, Text } = Typography;

export const OMSPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentStatus, setCurrentStatus] = useState<string>('all');
    const { convertAndFormat } = useCurrencyConverter();

    // 1. Fetch Orders with Pagination & Filtering
    const { data: orders, isLoading } = useQuery({
        queryKey: ['admin-orders', currentPage, currentStatus],
        queryFn: () => orderApi.getOrders({
            page: currentPage,
            limit: 10,
            status: currentStatus === 'all' ? undefined : currentStatus
        }),
    });

    // 2. Fetch Single Order Details
    const { data: orderDetails, isLoading: isDetailsLoading } = useQuery({
        queryKey: ['admin-order', selectedOrderId],
        queryFn: () => orderApi.getOrder(selectedOrderId!),
        enabled: !!selectedOrderId,
    });

    usePageHeader({
        title: isDrawerVisible && orderDetails ? `Order ${orderDetails.code}` : 'Order Management',
        subtitle: isDrawerVisible && orderDetails ? `Command Center · ORD-INTEGRITY` : 'Command Center · Standardized State Machine',
        isLoading: isDrawerVisible && isDetailsLoading
    });

    // 3. Status Transition Mutation
    const transitionMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatusEnum }) =>
            orderApi.transitionStatus(id, status, 'Bản cập nhật từ Admin Console'),
        onSuccess: () => {
            message.success('Cập nhật trạng thái thành công');
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-order', selectedOrderId] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        }
    });

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'code',
            key: 'code',
            render: (text: string) => <Text strong className="font-mono">{text}</Text>,
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (record: OrderListItem) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.user?.fullName || record.guestFullName || 'Khách vãng lai'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.user?.email || record.guestEmail}</Text>
                </Space>
            ),
        },
        {
            title: 'Giá trị',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount: number) => <Text>{convertAndFormat(amount)}</Text>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: OrderStatusEnum) => (
                <Tag color={ORDER_STATUS_CONFIG[status]?.color}>
                    {ORDER_STATUS_CONFIG[status]?.label}
                </Tag>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (record: OrderListItem) => (
                <Button
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelectedOrderId(record.id);
                        setIsDrawerVisible(true);
                    }}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    const renderTransitionButtons = (currentStatus: OrderStatusEnum) => {
        const nextStatuses = VALID_TRANSITIONS[currentStatus] || [];
        return (
            <Space wrap>
                {nextStatuses.map(status => (
                    <Popconfirm
                        key={status}
                        title="Xác nhận chuyển trạng thái?"
                        description={`Bạn có chắc chắn muốn chuyển sang "${ORDER_STATUS_CONFIG[status]?.label}"?`}
                        onConfirm={() => transitionMutation.mutate({ id: selectedOrderId!, status })}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <Button
                            type="primary"
                            ghost
                            icon={<ArrowRightOutlined />}
                            loading={transitionMutation.isPending}
                        >
                            Chuyển sang {ORDER_STATUS_CONFIG[status]?.label}
                        </Button>
                    </Popconfirm>
                ))}
            </Space>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <Tabs
                activeKey={currentStatus}
                onChange={(key) => {
                    setCurrentStatus(key);
                    setCurrentPage(1);
                }}
                className="luxury-tabs mb-6"
                items={[
                    { key: 'all', label: 'TẤT CẢ' },
                    { key: 'PENDING_PAYMENT', label: 'CHỜ THANH TOÁN' },
                    { key: 'CONFIRMED', label: 'ĐÃ XÁC NHẬN' },
                    { key: 'IN_PRODUCTION', label: 'ĐANG CHẾ TÁC' },
                    { key: 'SHIPPED', label: 'ĐANG GIAO' },
                    { key: 'DELIVERED', label: 'ĐÃ GIAO' },
                    { key: 'CANCELLED', label: 'ĐÃ HỦY' },
                ]}
            />

            <Card className="shadow-sm border-gray-100 italic-shadow">
                <Table
                    columns={columns}
                    dataSource={orders?.items || []}
                    loading={isLoading}
                    rowKey="id"
                    pagination={{
                        current: currentPage,
                        pageSize: 10,
                        total: orders?.meta?.total || 0,
                        showSizeChanger: false
                    }}
                    onChange={handleTableChange}
                />
            </Card>

            <Drawer
                title={<Title level={4} className="!mb-0">Chi tiết đơn hàng {orderDetails?.code}</Title>}
                placement="right"
                width={800}
                onClose={() => setIsDrawerVisible(false)}
                open={isDrawerVisible}
                extra={
                    <Space>
                        <Button onClick={() => setIsDrawerVisible(false)}>Đóng</Button>
                    </Space>
                }
            >
                {isDetailsLoading ? (
                    <div className="flex justify-center py-20"><LoadingOutlined style={{ fontSize: 40 }} /></div>
                ) : orderDetails && (
                    <div className="space-y-8 pb-20">
                        <Descriptions title="Thông tin cơ bản" bordered column={2}>
                            <Descriptions.Item label="Mã đơn">{orderDetails.code}</Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">{new Date(orderDetails.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
                            <Descriptions.Item label="Khách hàng">{orderDetails.user?.fullName || orderDetails.guestFullName || 'Khách vãng lai'}</Descriptions.Item>
                            <Descriptions.Item label="Email">{orderDetails.user?.email || orderDetails.guestEmail}</Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền">
                                <Text strong type="danger">{orderDetails.totalAmount.toLocaleString('vi-VN')} VND</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thanh toán">
                                <Tag color={orderDetails.paymentStatus === 'PAID' ? 'green' : 'orange'}>
                                    {orderDetails.paymentStatus}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation="left">Sản phẩm</Divider>
                        <Table
                            dataSource={orderDetails.items}
                            pagination={false}
                            rowKey="id"
                            size="small"
                            columns={[
                                { title: 'Sản phẩm', dataIndex: 'productName' },
                                { title: 'Phân loại', dataIndex: 'variantName' },
                                { title: 'SL', dataIndex: 'quantity' },
                                { title: 'Giá', dataIndex: 'price', render: (v) => v.toLocaleString('vi-VN') },
                                { title: 'Tổng', dataIndex: 'totalLine', render: (v) => v.toLocaleString('vi-VN'), className: 'font-bold' },
                            ]}
                        />

                        <Divider orientation="left">Quản lý trạng thái</Divider>
                        <Card className="bg-gray-50 border-none">
                            <div className="space-y-4">
                                <div>
                                    <Text type="secondary">Trạng thái hiện tại: </Text>
                                    <Tag color={ORDER_STATUS_CONFIG[orderDetails.status]?.color} className="ml-2">
                                        {ORDER_STATUS_CONFIG[orderDetails.status]?.label}
                                    </Tag>
                                </div>
                                {renderTransitionButtons(orderDetails.status)}
                            </div>
                        </Card>

                        <Divider orientation="left">Lịch sử xử lý (Timeline)</Divider>
                        <Timeline
                            items={orderDetails.timelines?.map(event => ({
                                color: event.action === 'ORDER_CANCELLED' ? 'red' : 'green',
                                children: (
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <Text strong>{event.action.replace(/_/g, ' ')}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{new Date(event.createdAt).toLocaleString('vi-VN')}</Text>
                                        </div>
                                        <Text type="secondary" italic>{event.description}</Text>
                                        <div className="mt-1">
                                            <Tag>{event.fromStatus} → {event.toStatus}</Tag>
                                            <Text type="secondary" style={{ fontSize: 10 }} className="ml-2">Actor: {event.actorType}</Text>
                                        </div>
                                    </div>
                                ),
                            }))}
                        />
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default OMSPage;
