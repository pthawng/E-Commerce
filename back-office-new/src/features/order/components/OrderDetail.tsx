import React, { useState } from 'react';
import {
    Card, Typography, Divider, Table, Tag, Timeline,
    Button, Descriptions, Avatar, Space, Modal, Input, Empty
} from 'antd';
import {
    CheckCircleOutlined, SyncOutlined, CarOutlined,
    CloseCircleOutlined, WalletOutlined, UserOutlined
} from '@ant-design/icons';
import type { Order, OrderTimeline } from '../types';
import { OrderStatus } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
dayjs.extend(relativeTime);
dayjs.locale('vi');

import { useUpdateOrderStatus, useCancelOrder, useUpdateTracking } from '../hooks';

const { Title, Text, Paragraph } = Typography;

interface OrderDetailProps {
    order: Order | null;
    loading?: boolean;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ order, loading }) => {
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const [trackingModalVisible, setTrackingModalVisible] = useState(false);
    const [trackingCode, setTrackingCode] = useState('');

    const statusMutation = useUpdateOrderStatus();
    const cancelMutation = useCancelOrder();
    const trackingMutation = useUpdateTracking();

    if (loading) return <Card loading />;
    if (!order) return (
        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Empty description="Chọn một đơn hàng để xem chi tiết" />
        </div>
    );

    const handleUpdateStatus = (newStatus: OrderStatus) => {
        statusMutation.mutate({ id: order.id, status: newStatus });
    };

    const handleCancelOrder = () => {
        cancelMutation.mutate({ id: order.id, reason: cancelReason }, {
            onSuccess: () => {
                setCancelModalVisible(false);
                setCancelReason('');
            }
        });
    };

    const handleUpdateTracking = () => {
        trackingMutation.mutate({ id: order.id, trackingCode }, {
            onSuccess: () => {
                setTrackingModalVisible(false);
            }
        });
    };

    const getTimelineIcon = (timeline: OrderTimeline) => {
        switch (timeline.toStatus) {
            case OrderStatus.CONFIRMED: return <CheckCircleOutlined className="text-blue-500" />;
            case OrderStatus.PROCESSING: return <SyncOutlined spin className="text-orange-500" />;
            case OrderStatus.SHIPPING: return <CarOutlined className="text-purple-500" />;
            case OrderStatus.DELIVERED: return <CheckCircleOutlined className="text-green-500" />;
            case OrderStatus.CANCELLED: return <CloseCircleOutlined className="text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col gap-6 p-1 h-full overflow-y-auto">
            {/* Header & Quick Actions */}
            <div className="flex justify-between items-start sticky top-0 bg-gray-50 z-10 py-2">
                <Space direction="vertical" size={2}>
                    <Space align="center">
                        <Title level={4} style={{ margin: 0 }}>#{order.code}</Title>
                        <Tag color="blue" bordered={false} className="rounded-full">{order.status.toUpperCase()}</Tag>
                    </Space>
                    <Text type="secondary">{dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                </Space>

                <Space wrap>
                    {order.status === OrderStatus.PENDING && (
                        <Button type="primary" onClick={() => handleUpdateStatus(OrderStatus.CONFIRMED)}>Xác nhận</Button>
                    )}
                    {order.status === OrderStatus.CONFIRMED && (
                        <Button type="primary" onClick={() => handleUpdateStatus(OrderStatus.PROCESSING)}>Bắt đầu xử lý</Button>
                    )}
                    {order.status === OrderStatus.PROCESSING && (
                        <Button onClick={() => {
                            setTrackingCode(order.trackingCode || '');
                            setTrackingModalVisible(true);
                        }}>Cập nhật vận đơn</Button>
                    )}
                    {order.status === OrderStatus.PROCESSING && (
                        <Button type="primary" onClick={() => handleUpdateStatus(OrderStatus.SHIPPING)}>Bắt đầu giao hàng</Button>
                    )}
                    {order.status === OrderStatus.SHIPPING && (
                        <Button type="primary" className="bg-green-600 border-green-600" onClick={() => handleUpdateStatus(OrderStatus.DELIVERED)}>Đã giao hàng</Button>
                    )}

                    {!([OrderStatus.CANCELLED, OrderStatus.DELIVERED, OrderStatus.COMPLETED] as OrderStatus[]).includes(order.status) && (
                        <Button danger onClick={() => setCancelModalVisible(true)}>Hủy đơn</Button>
                    )}
                </Space>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column: Products & Totals */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <Card
                        title={<Title level={5} style={{ margin: 0 }}>Sản phẩm ({order.items?.length || 0})</Title>}
                        bordered={false}
                        className="shadow-sm border border-gray-100 rounded-xl overflow-hidden"
                    >
                        <Table
                            dataSource={order.items}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            columns={[
                                {
                                    title: 'Sản phẩm',
                                    key: 'product',
                                    render: (_, item) => (
                                        <Space size="middle">
                                            <Avatar shape="square" size={48} src={item.thumbnailUrl} icon={<UserOutlined />} className="bg-gray-100" />
                                            <Space direction="vertical" size={0}>
                                                <Text strong className="line-clamp-1">{item.productName}</Text>
                                                <Text type="secondary" style={{ fontSize: '11px' }}>SKU: {item.sku}</Text>
                                                {item.variantTitle && (
                                                    <div className="flex gap-1 mt-1">
                                                        {Object.entries(item.variantTitle).map(([key, val]) => (
                                                            <Tag key={key} style={{ fontSize: '10px', margin: 0 }}>{val as string}</Tag>
                                                        ))}
                                                    </div>
                                                )}
                                            </Space>
                                        </Space>
                                    ),
                                },
                                {
                                    title: 'Đơn giá',
                                    dataIndex: 'price',
                                    key: 'price',
                                    align: 'right',
                                    render: (v) => `${v.toLocaleString()}đ`,
                                },
                                {
                                    title: 'SL',
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    align: 'center',
                                },
                                {
                                    title: 'Tổng',
                                    dataIndex: 'totalLine',
                                    key: 'totalLine',
                                    align: 'right',
                                    render: (v) => <Text strong>{v.toLocaleString()}đ</Text>,
                                },
                            ]}
                        />

                        <Divider className="my-4" />

                        <div className="flex justify-end pr-4">
                            <Space direction="vertical" align="end" className="w-[300px]">
                                <div className="flex justify-between w-full">
                                    <Text type="secondary">Tạm tính:</Text>
                                    <Text>{order.subTotal.toLocaleString()}đ</Text>
                                </div>
                                <div className="flex justify-between w-full">
                                    <Text type="secondary">Phí vận chuyển:</Text>
                                    <Text>{order.shippingFee.toLocaleString()}đ</Text>
                                </div>
                                <div className="flex justify-between w-full">
                                    <Text type="secondary">Giảm giá:</Text>
                                    <Text className="text-red-500">-{order.discountAmount.toLocaleString()}đ</Text>
                                </div>
                                <Divider className="my-2" />
                                <div className="flex justify-between w-full">
                                    <Text strong style={{ fontSize: '18px' }}>Tổng cộng:</Text>
                                    <Title level={4} style={{ margin: 0, color: '#1677ff' }}>{order.totalAmount.toLocaleString()}đ</Title>
                                </div>
                            </Space>
                        </div>
                    </Card>

                    {/* Payment & Shipping Blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Thông tin khách hàng" bordered={false} className="shadow-sm border border-gray-100 rounded-xl">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Họ tên"><Text strong>{order.shippingAddress.fullName}</Text></Descriptions.Item>
                                <Descriptions.Item label="SĐT">{order.shippingAddress.phone}</Descriptions.Item>
                                <Descriptions.Item label="Email">{order.user?.email || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Địa chỉ">
                                    <Paragraph className="mb-0 text-gray-500">
                                        {order.shippingAddress.address}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
                                    </Paragraph>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="Vận chuyển & Thanh toán" bordered={false} className="shadow-sm border border-gray-100 rounded-xl">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Thanh toán">
                                    <Space>
                                        <WalletOutlined />
                                        {order.paymentMethod}
                                        <Tag color={order.paymentStatus === 'paid' ? 'green' : 'orange'} bordered={false}>
                                            {order.paymentStatus.toUpperCase()}
                                        </Tag>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Mã vận đơn">
                                    <Text copyable={!!order.trackingCode}>{order.trackingCode || 'Chưa có'}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Ghi chú khách">
                                    <Text italic className="text-gray-400">{order.note || 'Không có ghi chú'}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Timeline */}
                <div className="flex flex-col gap-6 h-full">
                    <Card
                        title={<Title level={5} style={{ margin: 0 }}>Lịch sử đơn hàng</Title>}
                        bordered={false}
                        className="shadow-sm border border-gray-100 rounded-xl flex-1 bg-white flex flex-col"
                        bodyStyle={{ flex: 1, overflow: 'auto' }}
                    >
                        <Timeline
                            items={order.timelines?.map((t) => ({
                                dot: getTimelineIcon(t),
                                children: (
                                    <div className="flex flex-col gap-1 mb-4">
                                        <div className="flex justify-between items-start">
                                            <Text strong>{t.action.replace('STATUS_UPDATE_', '')}</Text>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>{dayjs(t.createdAt).fromNow()}</Text>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>{t.description}</Text>
                                        {t.actorType === 'admin' && <Tag bordered={false} style={{ width: 'fit-content', fontSize: '10px' }}>ADMIN</Tag>}
                                    </div>
                                ),
                            })) || []}
                        />
                    </Card>
                </div>
            </div>

            {/* Cancel Modal */}
            <Modal
                title="Lý do hủy đơn"
                open={cancelModalVisible}
                onOk={handleCancelOrder}
                onCancel={() => setCancelModalVisible(false)}
                okText="Xác nhận hủy"
                cancelText="Bỏ qua"
                okButtonProps={{ danger: true, loading: cancelMutation.isPending }}
            >
                <Input.TextArea
                    placeholder="Nhập lý do khách hủy hoặc shop hủy..."
                    rows={4}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                />
            </Modal>
            <Modal
                title="Cập nhật thông tin vận chuyển"
                open={trackingModalVisible}
                onOk={handleUpdateTracking}
                onCancel={() => setTrackingModalVisible(false)}
                okButtonProps={{ loading: trackingMutation.isPending }}
            >
                <Space direction="vertical" className="w-full" size="middle">
                    <div>
                        <Text strong>Mã vận đơn</Text>
                        <Input
                            placeholder="Nhập mã từ đơn vị vận chuyển..."
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                </Space>
            </Modal>
        </div>
    );
};
