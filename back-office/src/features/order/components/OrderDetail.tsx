import React, { useState, useEffect } from 'react';
import {
    Typography, Divider, Table, Tag, Timeline,
    Button, Descriptions, Avatar, Space, Modal, Input, Empty
} from 'antd';
import {
    CheckCircleOutlined, SyncOutlined, CarOutlined,
    CloseCircleOutlined, WalletOutlined, UserOutlined,
    CloseOutlined
} from '@ant-design/icons';
import type { Order, OrderTimeline, OrderStatus } from '@/entities/order/model/types';
import { OrderStatus as OrderStatusEnum } from '@/entities/order/model/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { colors } from '@/shared/design-system/colors';
import { typography } from '@/shared/design-system/typography';
import { radius } from '@/shared/design-system/radius';
import { GlassCard } from '@/shared/ui/GlassCard';
import { useUpdateOrderStatus, useCancelOrder, useUpdateTracking } from '@/entities/order/model/queries';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text, Paragraph } = Typography;

interface OrderDetailProps {
    order: Order | null;
    loading?: boolean;
    onClose?: () => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ order, loading, onClose }) => {
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [trackingModalVisible, setTrackingModalVisible] = useState(false);
    const [trackingCode, setTrackingCode] = useState('');

    const statusMutation = useUpdateOrderStatus();
    const cancelMutation = useCancelOrder();
    const trackingMutation = useUpdateTracking();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (loading) return <GlassCard loading variant="borderless" />;

    if (!order) return (
        <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.background.body,
            borderRadius: radius.lg,
            border: `1px dashed ${colors.border.subtle}`
        }}>
            <Empty description={<span style={{ color: colors.neutral[400] }}>Select an order to view details</span>} />
        </div>
    );

    const getStatusStyle = (status: OrderStatus) => {
        switch (status) {
            case OrderStatusEnum.COMPLETED:
            case OrderStatusEnum.DELIVERED:
                return { color: colors.success.main, bg: `${colors.success.main}12` };
            case OrderStatusEnum.PENDING:
            case OrderStatusEnum.CONFIRMED:
            case OrderStatusEnum.PROCESSING:
                return { color: colors.warning.main, bg: `${colors.warning.main}12` };
            case OrderStatusEnum.CANCELLED:
                return { color: colors.error.main, bg: `${colors.error.main}12` };
            case OrderStatusEnum.SHIPPING:
                return { color: colors.info.main, bg: `${colors.info.main}12` };
            default:
                return { color: colors.neutral[600], bg: colors.neutral[100] };
        }
    };

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
            case OrderStatusEnum.CONFIRMED: return <CheckCircleOutlined style={{ color: colors.success.main }} />;
            case OrderStatusEnum.PROCESSING: return <SyncOutlined spin style={{ color: colors.warning.main }} />;
            case OrderStatusEnum.SHIPPING: return <CarOutlined style={{ color: colors.info.main }} />;
            case OrderStatusEnum.DELIVERED: return <CheckCircleOutlined style={{ color: colors.success.main }} />;
            case OrderStatusEnum.CANCELLED: return <CloseCircleOutlined style={{ color: colors.error.main }} />;
            default: return null;
        }
    };

    const statusStyle = getStatusStyle(order.status);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            padding: '4px',
            height: '100%',
            overflowY: 'auto',
            background: colors.background.body
        }}>
            {/* High-End Sticky Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                position: 'sticky',
                top: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                zIndex: 10,
                padding: '24px 32px',
                borderBottom: `1px solid ${colors.neutral[100]}`,
                margin: '0 -4px'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Space align="center" size={16}>
                            <Title level={4} style={{
                                margin: 0,
                                fontFamily: typography.fontFamily.serif,
                                letterSpacing: '-0.01em',
                                color: colors.primary.main
                            }}>
                                Order #{order.code}
                            </Title>
                            <Tag
                                style={{
                                    color: statusStyle.color,
                                    background: statusStyle.bg,
                                    border: `1px solid ${statusStyle.color}20`,
                                    borderRadius: '100px',
                                    padding: '2px 14px',
                                    fontWeight: 700,
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                }}
                            >
                                {order.status.replace('_', ' ')}
                            </Tag>
                        </Space>

                        {onClose && (
                            <Button
                                type="text"
                                icon={<CloseOutlined style={{ fontSize: '16px' }} />}
                                onClick={onClose}
                                style={{ color: colors.neutral[400] }}
                                className="hover-scale"
                            />
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.neutral[500], fontSize: '12px' }}>
                            Created on {dayjs(order.createdAt).format('DD MMM, YYYY · HH:mm')}
                        </Text>

                        <Space wrap>
                            {order.status === OrderStatusEnum.PENDING && (
                                <Button
                                    type="primary"
                                    onClick={() => handleUpdateStatus(OrderStatusEnum.CONFIRMED)}
                                    style={{ borderRadius: radius.xs, fontWeight: 600 }}
                                >
                                    Confirm Order
                                </Button>
                            )}
                            {order.status === OrderStatusEnum.CONFIRMED && (
                                <Button
                                    type="primary"
                                    onClick={() => handleUpdateStatus(OrderStatusEnum.PROCESSING)}
                                    style={{ borderRadius: radius.xs, fontWeight: 600 }}
                                >
                                    Start Processing
                                </Button>
                            )}
                            {order.status === OrderStatusEnum.PROCESSING && (
                                <Button
                                    onClick={() => {
                                        setTrackingCode(order.trackingCode || '');
                                        setTrackingModalVisible(true);
                                    }}
                                    style={{ borderRadius: radius.xs }}
                                >
                                    Update Tracking
                                </Button>
                            )}
                            {order.status === OrderStatusEnum.PROCESSING && (
                                <Button
                                    type="primary"
                                    onClick={() => handleUpdateStatus(OrderStatusEnum.SHIPPING)}
                                    style={{ borderRadius: radius.xs, fontWeight: 600 }}
                                >
                                    Deploy Shipment
                                </Button>
                            )}
                            {order.status === OrderStatusEnum.SHIPPING && (
                                <Button
                                    type="primary"
                                    style={{ backgroundColor: colors.success.main, borderColor: colors.success.main, borderRadius: radius.xs, fontWeight: 600 }}
                                    onClick={() => handleUpdateStatus(OrderStatusEnum.DELIVERED)}
                                >
                                    Mark Delivered
                                </Button>
                            )}

                            {!([OrderStatusEnum.CANCELLED, OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED] as OrderStatus[]).includes(order.status) && (
                                <Button
                                    danger
                                    onClick={() => setCancelModalVisible(true)}
                                    style={{ borderRadius: radius.xs }}
                                >
                                    Cancel
                                </Button>
                            )}
                        </Space>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 32px 48px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Section: Line Items */}
                        <GlassCard
                            title={<span style={{ fontFamily: typography.fontFamily.serif, color: colors.primary.main }}>Line Items</span>}
                            variant="borderless"
                        >
                            <Table
                                dataSource={order.items}
                                rowKey="id"
                                pagination={false}
                                size="middle"
                                columns={[
                                    {
                                        title: 'Product',
                                        key: 'product',
                                        render: (_, item) => (
                                            <Space size="large">
                                                <Avatar
                                                    shape="square"
                                                    size={72}
                                                    src={item.thumbnailUrl}
                                                    icon={<UserOutlined />}
                                                    style={{
                                                        border: `1px solid ${colors.border.subtle}`,
                                                        borderRadius: radius.sm,
                                                        background: colors.background.body
                                                    }}
                                                />
                                                <Space orientation="vertical" size={2}>
                                                    <Text strong style={{ color: colors.neutral[900], fontSize: '14px' }}>{item.productName}</Text>
                                                    <Text style={{ fontSize: '12px', color: colors.neutral[500] }}>SKU: {item.sku}</Text>
                                                    {item.variantTitle && (
                                                        <Space size={4} wrap style={{ marginTop: '4px' }}>
                                                            {Object.entries(item.variantTitle).map(([key, val]) => (
                                                                <Tag key={key} style={{ fontSize: '10px', margin: 0, borderRadius: '4px' }} color="default">{val as string}</Tag>
                                                            ))}
                                                        </Space>
                                                    )}
                                                </Space>
                                            </Space>
                                        ),
                                    },
                                    {
                                        title: 'Price',
                                        dataIndex: 'price',
                                        key: 'price',
                                        align: 'right',
                                        render: (v) => (
                                            <Text style={{ color: colors.neutral[600] }}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}
                                            </Text>
                                        ),
                                    },
                                    {
                                        title: 'Qty',
                                        dataIndex: 'quantity',
                                        key: 'quantity',
                                        align: 'center',
                                        render: (q) => <Text style={{ color: colors.neutral[900] }}>×{q}</Text>
                                    },
                                    {
                                        title: 'Subtotal',
                                        dataIndex: 'totalLine',
                                        key: 'totalLine',
                                        align: 'right',
                                        render: (v) => <Text strong style={{ color: colors.primary.main }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}</Text>,
                                    },
                                ]}
                            />

                            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                                <Space orientation="vertical" align="end" style={{ width: '300px' }} size={8}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <Text style={{ color: colors.neutral[500] }}>Subtotal</Text>
                                        <Text>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subTotal)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <Text style={{ color: colors.neutral[500] }}>Shipping</Text>
                                        <Text>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shippingFee)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <Text style={{ color: colors.neutral[500] }}>Discounts</Text>
                                        <Text style={{ color: colors.error.main }}>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discountAmount)}</Text>
                                    </div>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'baseline' }}>
                                        <Text strong style={{ color: colors.primary.main, fontSize: '15px' }}>Total Amount</Text>
                                        <Title level={3} style={{ margin: 0, color: colors.secondary.main, fontFamily: typography.fontFamily.sans }}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                        </Title>
                                    </div>
                                </Space>
                            </div>
                        </GlassCard>

                        {/* Section: Financial Ledger */}
                        <GlassCard
                            title={<span style={{ fontFamily: typography.fontFamily.serif, color: colors.primary.main }}>Financial Ledger</span>}
                            variant="borderless"
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: colors.background.surface,
                                    padding: '20px 24px',
                                    borderRadius: radius.md,
                                    border: `1px solid ${colors.border.subtle}`
                                }}>
                                    <Space size={48}>
                                        <Space orientation="vertical" size={2}>
                                            <Text style={{ fontSize: '10px', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: '0.05em' }}>METHOD</Text>
                                            <Space size={8}>
                                                <WalletOutlined style={{ color: colors.primary.main }} />
                                                <Text strong style={{ color: colors.primary.main }}>{order.paymentMethod}</Text>
                                            </Space>
                                        </Space>
                                        <Divider type="vertical" style={{ height: 32 }} />
                                        <Space orientation="vertical" size={2}>
                                            <Text style={{ fontSize: '10px', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</Text>
                                            <Tag color={order.paymentStatus === 'paid' ? 'success' : 'warning'} bordered={false} style={{ fontWeight: 700, borderRadius: '100px' }}>
                                                {order.paymentStatus.toUpperCase()}
                                            </Tag>
                                        </Space>
                                    </Space>

                                    {order.paymentStatus === 'unpaid' && order.paymentMethod === 'COD' && (
                                        <Button size="middle" type="primary" style={{ borderRadius: radius.sm }}>Log COD Receipt</Button>
                                    )}
                                </div>

                                {order.transactions && order.transactions.length > 0 ? (
                                    <Table
                                        dataSource={order.transactions}
                                        rowKey="id"
                                        pagination={false}
                                        size="small"
                                        style={{ marginTop: '8px' }}
                                        columns={[
                                            {
                                                title: 'Transaction Reference',
                                                dataIndex: 'transactionCode',
                                                key: 'transactionCode',
                                                render: (v) => <Text style={{ fontSize: '12px', fontFamily: 'monospace', color: colors.neutral[600] }}>{v || 'N/A'}</Text>
                                            },
                                            {
                                                title: 'Type',
                                                dataIndex: 'type',
                                                key: 'type',
                                                render: (v) => <Tag style={{ fontSize: '10px', borderRadius: '4px' }} color={v === 'payment' ? 'processing' : 'warning'}>{v.toUpperCase()}</Tag>
                                            },
                                            {
                                                title: 'Amount',
                                                dataIndex: 'amount',
                                                key: 'amount',
                                                align: 'right',
                                                render: (v) => <Text strong style={{ fontSize: '13px' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}</Text>
                                            },
                                            {
                                                title: 'Status',
                                                dataIndex: 'status',
                                                key: 'status',
                                                render: (v) => <Tag bordered={false} color={v === 'success' ? 'success' : 'error'} style={{ fontSize: '10px', fontWeight: 600 }}>{v.toUpperCase()}</Tag>
                                            },
                                            {
                                                title: 'Log Date',
                                                dataIndex: 'createdAt',
                                                key: 'createdAt',
                                                render: (v) => <Text style={{ fontSize: '11px', color: colors.neutral[500] }}>{dayjs(v).format('DD MMM, HH:mm')}</Text>
                                            }
                                        ]}
                                    />
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No financial events logged" />
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Section: Customer Profile */}
                        <GlassCard title={<span style={{ fontFamily: typography.fontFamily.serif, color: colors.primary.main }}>Customer Profile</span>} variant="borderless">
                            <Space align="center" style={{ marginBottom: 24 }}>
                                <Avatar size={56} icon={<UserOutlined />} style={{ backgroundColor: `${colors.primary.main}12`, color: colors.primary.main }} />
                                <Space orientation="vertical" size={2}>
                                    <Text strong style={{ fontSize: '16px', color: colors.neutral[900] }}>{order.shippingAddress.fullName}</Text>
                                    <Text style={{ fontSize: '13px', color: colors.neutral[500] }}>{order.user?.email || 'Registered Guest'}</Text>
                                </Space>
                            </Space>
                            <Divider style={{ margin: '16px 0' }} />
                            <Descriptions column={1} size="small" labelStyle={{ color: colors.neutral[500], width: '80px' }}>
                                <Descriptions.Item label="Phone">{order.shippingAddress.phone}</Descriptions.Item>
                                <Descriptions.Item label="Address">
                                    <Paragraph style={{ marginBottom: 0, color: colors.neutral[700], fontSize: '13px', lineHeight: '1.6' }}>
                                        {order.shippingAddress.address}, {order.shippingAddress.ward}<br />
                                        {order.shippingAddress.district}, {order.shippingAddress.city}
                                    </Paragraph>
                                </Descriptions.Item>
                                <Descriptions.Item label="Instructions">
                                    <Text italic style={{ color: colors.secondary.main, fontSize: '13px' }}>{order.note || 'No specific instructions logged'}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </GlassCard>

                        {/* Section: Operational Timeline */}
                        <GlassCard title={<span style={{ fontFamily: typography.fontFamily.serif, color: colors.primary.main }}>Operations Log</span>} variant="borderless">
                            <div style={{ background: colors.background.surface, padding: '16px', borderRadius: radius.md, border: `1px solid ${colors.border.subtle}`, marginBottom: '24px' }}>
                                <Space>
                                    <CarOutlined style={{ color: colors.neutral[400] }} />
                                    <Text style={{ fontSize: '12px', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking Reference:</Text>
                                    <Text strong style={{ color: colors.primary.main }}>{order.trackingCode || 'NOT_ASSIGNED'}</Text>
                                </Space>
                            </div>
                            <Timeline
                                reverse={true}
                                items={order.timelines?.map((t) => ({
                                    dot: getTimelineIcon(t),
                                    children: (
                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                <Text strong style={{ fontSize: '13px', color: colors.neutral[900] }}>
                                                    {t.action.replace('STATUS_UPDATE_', '').replace('_', ' ')}
                                                </Text>
                                                <Text style={{ fontSize: '10px', color: colors.neutral[400], marginLeft: 'auto' }}>
                                                    {dayjs(t.createdAt).format('HH:mm')}
                                                </Text>
                                            </div>
                                            <Paragraph style={{ fontSize: '12px', color: colors.neutral[500], margin: '4px 0' }}>{t.description}</Paragraph>
                                            <Text style={{ fontSize: '10px', color: colors.neutral[400] }}>{dayjs(t.createdAt).format('DD MMM, YYYY')}</Text>
                                        </div>
                                    ),
                                })) || []}
                            />
                        </GlassCard>
                    </div>
                </div>
            </div>

            {/* Premium Decision Overlays */}
            <Modal
                title="Authorization: Order Cancellation"
                open={cancelModalVisible}
                onOk={handleCancelOrder}
                onCancel={() => setCancelModalVisible(false)}
                okText="Revoke Order"
                cancelText="Retain"
                okButtonProps={{ danger: true, loading: cancelMutation.isPending }}
                style={{ borderRadius: radius.lg }}
            >
                <div style={{ marginBottom: '16px' }}>
                    <Text type="secondary">Provide a detailed justification for the operational revocation of this order.</Text>
                </div>
                <Input.TextArea
                    placeholder="Justification required for audit logs..."
                    rows={4}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{ borderRadius: radius.sm }}
                />
            </Modal>

            <Modal
                title="Logistics: Tracking Assignment"
                open={trackingModalVisible}
                onOk={handleUpdateTracking}
                onCancel={() => setTrackingModalVisible(false)}
                okButtonProps={{ loading: trackingMutation.isPending }}
            >
                <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                        <Text strong>Consignment Reference</Text>
                        <Input
                            placeholder="Enter carrier reference number..."
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            style={{ marginTop: '8px', borderRadius: radius.sm }}
                        />
                    </div>
                </Space>
            </Modal>
        </div>
    );
};

