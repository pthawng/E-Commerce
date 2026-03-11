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
        <div className="flex flex-col gap-6 p-1 h-full overflow-y-auto bg-gray-50/30">
            {/* Header / Sticky Bar */}
            <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 px-6 border-b border-gray-100 -mx-1">
                <Space direction="vertical" size={2}>
                    <Space align="center">
                        <Title level={4} style={{ margin: 0 }}>Đơn hàng #{order.code}</Title>
                        <Tag color="blue" bordered={false} className="rounded-full">{order.status.toUpperCase()}</Tag>
                    </Space>
                    <Text type="secondary">{dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                </Space>

                <Space wrap>
                    {order.status === OrderStatus.PENDING && (
                        <Button type="primary" onClick={() => handleUpdateStatus(OrderStatus.CONFIRMED)}>Xác nhận đơn</Button>
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

            <div className="px-5 pb-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column: Items & Totals */}
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        {/* Section: Sản phẩm */}
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
                                                <Avatar shape="square" size={64} src={item.thumbnailUrl} icon={<UserOutlined />} className="bg-gray-100 border border-gray-50" />
                                                <Space direction="vertical" size={0}>
                                                    <Text strong className="line-clamp-1">{item.productName}</Text>
                                                    <Text type="secondary" style={{ fontSize: '11px' }}>SKU: {item.sku}</Text>
                                                    {item.variantTitle && (
                                                        <div className="flex gap-1 mt-1">
                                                            {Object.entries(item.variantTitle).map(([key, val]) => (
                                                                <Tag key={key} style={{ fontSize: '10px', margin: 0 }} className="bg-gray-50 border-gray-100">{val as string}</Tag>
                                                            ))}
                                                        </div>
                                                    )}
                                                </Space>
                                            </Space>
                                        ),
                                    },
                                    {
                                        title: 'Giá',
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
                                <Space direction="vertical" align="end" className="w-[300px]" size={4}>
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
                                    <div className="flex justify-between w-full items-baseline">
                                        <Text strong>Tổng thanh toán:</Text>
                                        <Title level={4} style={{ margin: 0, color: '#1677ff' }}>{order.totalAmount.toLocaleString()}đ</Title>
                                    </div>
                                </Space>
                            </div>
                        </Card>

                        {/* Section: Thanh toán (Professional Audit View) */}
                        <Card title={<Title level={5} style={{ margin: 0 }}>Giao dịch thanh toán</Title>} bordered={false} className="shadow-sm border border-gray-100 rounded-xl">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <Space size="large">
                                        <Space direction="vertical" size={0}>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>PHƯƠNG THỨC</Text>
                                            <Space>
                                                <WalletOutlined />
                                                <Text strong>{order.paymentMethod}</Text>
                                            </Space>
                                        </Space>
                                        <Divider type="vertical" style={{ height: 32 }} />
                                        <Space direction="vertical" size={0}>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>TRẠNG THÁI</Text>
                                            <Tag color={order.paymentStatus === 'paid' ? 'green' : 'orange'} bordered={false} className="font-bold">
                                                {order.paymentStatus.toUpperCase()}
                                            </Tag>
                                        </Space>
                                    </Space>

                                    {order.paymentStatus === 'unpaid' && order.paymentMethod === 'COD' && (
                                        <Button size="small" type="primary">Xác nhận thanh toán (COD)</Button>
                                    )}
                                </div>

                                {order.transactions && order.transactions.length > 0 ? (
                                    <div className="mt-2">
                                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Lịch sử giao dịch:</Text>
                                        <Table
                                            dataSource={order.transactions}
                                            rowKey="id"
                                            pagination={false}
                                            size="small"
                                            columns={[
                                                {
                                                    title: 'Mã GD',
                                                    dataIndex: 'transactionCode',
                                                    key: 'transactionCode',
                                                    render: (v) => <Text style={{ fontSize: '12px' }}>{v || 'N/A'}</Text>
                                                },
                                                {
                                                    title: 'Loại',
                                                    dataIndex: 'type',
                                                    key: 'type',
                                                    render: (v) => <Tag style={{ fontSize: '10px' }} color={v === 'payment' ? 'blue' : 'orange'}>{v.toUpperCase()}</Tag>
                                                },
                                                {
                                                    title: 'Số tiền',
                                                    dataIndex: 'amount',
                                                    key: 'amount',
                                                    align: 'right',
                                                    render: (v) => <Text style={{ fontSize: '12px' }}>{v.toLocaleString()}đ</Text>
                                                },
                                                {
                                                    title: 'Trạng thái',
                                                    dataIndex: 'status',
                                                    key: 'status',
                                                    render: (v) => <Tag bordered={false} color={v === 'success' ? 'green' : 'red'} style={{ fontSize: '10px' }}>{v.toUpperCase()}</Tag>
                                                },
                                                {
                                                    title: 'Thời gian',
                                                    dataIndex: 'createdAt',
                                                    key: 'createdAt',
                                                    render: (v) => <Text type="secondary" style={{ fontSize: '11px' }}>{dayjs(v).format('DD/MM HH:mm')}</Text>
                                                }
                                            ]}
                                        />
                                    </div>
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử giao dịch" />
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Customer & Timeline */}
                    <div className="flex flex-col gap-6 h-full">
                        {/* Section: Khách hàng */}
                        <Card title={<Title level={5} style={{ margin: 0 }}>Khách hàng</Title>} bordered={false} className="shadow-sm border border-gray-100 rounded-xl">
                            <Space align="center" style={{ marginBottom: 16 }}>
                                <Avatar size={48} icon={<UserOutlined />} className="bg-blue-50 text-blue-500" />
                                <Space direction="vertical" size={0}>
                                    <Text strong>{order.shippingAddress.fullName}</Text>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>{order.user?.email || 'Khách vãng lai'}</Text>
                                </Space>
                            </Space>
                            <Divider style={{ margin: '12px 0' }} />
                            <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c' }}>
                                <Descriptions.Item label="Điện thoại">{order.shippingAddress.phone}</Descriptions.Item>
                                <Descriptions.Item label="Địa chỉ">
                                    <Paragraph className="mb-0 text-gray-600">
                                        {order.shippingAddress.address}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
                                    </Paragraph>
                                </Descriptions.Item>
                                <Descriptions.Item label="Ghi chú">
                                    <Text italic className="text-orange-400">{order.note || 'Không có ghi chú'}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Section: Vận chuyển */}
                        <Card title={<Title level={5} style={{ margin: 0 }}>Vận chuyển</Title>} bordered={false} className="shadow-sm border border-gray-100 rounded-xl">
                            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between mb-4">
                                <Space>
                                    <CarOutlined className="text-gray-400" />
                                    <Text type="secondary">Mã vận đơn:</Text>
                                    <Text strong>{order.trackingCode || 'Chưa cập nhật'}</Text>
                                </Space>
                                {order.trackingCode && <Text copyable={{ text: order.trackingCode }} />}
                            </div>
                            <Timeline
                                reverse={true}
                                items={order.timelines?.map((t) => ({
                                    dot: getTimelineIcon(t),
                                    children: (
                                        <div className="flex flex-col gap-0.5 mb-2">
                                            <div className="flex justify-between items-start">
                                                <Text strong style={{ fontSize: '13px' }}>{t.action.replace('STATUS_UPDATE_', '').replace('_', ' ')}</Text>
                                                <Text type="secondary" style={{ fontSize: '10px' }}>{dayjs(t.createdAt).format('HH:mm')}</Text>
                                            </div>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>{t.description}</Text>
                                            <Text type="secondary" style={{ fontSize: '10px' }}>{dayjs(t.createdAt).format('DD/MM/YYYY')}</Text>
                                        </div>
                                    ),
                                })) || []}
                            />
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modals from before remain same */}
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

