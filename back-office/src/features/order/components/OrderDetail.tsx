import React, { useState, useEffect } from 'react';
import {
    Typography, Divider, Table, Tag, Timeline,
    Button, Avatar, Space, Modal, Input, Empty, Badge
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
import { useUpdateOrderStatus, useCancelOrder, useUpdateTracking, useRefundOrder } from '@/entities/order/model/queries';
import { InvoicePrint } from './InvoicePrint';
import { PrinterOutlined } from '@ant-design/icons';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;

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

    const [refundModalVisible, setRefundModalVisible] = useState(false);
    const [refundAmount, setRefundAmount] = useState<number>(0);
    const [refundReason, setRefundReason] = useState('');

    const statusMutation = useUpdateOrderStatus();
    const cancelMutation = useCancelOrder();
    const trackingMutation = useUpdateTracking();
    const refundMutation = useRefundOrder();

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
            case OrderStatusEnum.RETURNED:
                return { color: colors.warning.main, bg: `${colors.warning.main}12` };
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
                // L8: Automate status transition upon logistics assignment
                statusMutation.mutate({ id: order.id, status: OrderStatusEnum.SHIPPING });
                setTrackingModalVisible(false);
            }
        });
    };

    const handleRefundOrder = () => {
        refundMutation.mutate({ id: order.id, amount: refundAmount, reason: refundReason }, {
            onSuccess: () => {
                setRefundModalVisible(false);
                setRefundReason('');
                setRefundAmount(0);
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
            case OrderStatusEnum.RETURNED: return <CloseCircleOutlined style={{ color: colors.warning.main }} />;
            default: return null;
        }
    };

    const statusStyle = getStatusStyle(order.status);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '0',
            height: '100%',
            overflowY: 'auto',
            background: colors.background.body
        }}>
            {/* FAANG L8: Hero HUD (Heads-Up Display) */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                padding: '24px 40px',
                borderBottom: `1px solid ${colors.neutral[100]}`,
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '32px'
            }}>
                {/* Left side: Identity & Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Title level={2} style={{
                            margin: 0,
                            fontFamily: typography.fontFamily.serif,
                            fontSize: '28px',
                            color: colors.primary.main,
                            letterSpacing: '-0.03em'
                        }}>
                            #{order.code}
                        </Title>
                        <Tag style={{
                            margin: 0,
                            borderRadius: '100px',
                            padding: '2px 16px',
                            fontWeight: 700,
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            border: 'none',
                            background: statusStyle.bg,
                            color: statusStyle.color
                        }}>
                            {order.status.replace('_', ' ')}
                        </Tag>
                    </div>
                    <Space split={<Divider type="vertical" style={{ height: '10px' }} />} size={8}>
                        <Text style={{ fontSize: '13px', color: colors.neutral[400] }}>
                            {dayjs(order.createdAt).format('DD MMM YYYY · HH:mm')}
                        </Text>
                        <Text style={{ fontSize: '13px', color: colors.neutral[400], cursor: 'help' }}>
                            Channel: <span style={{ color: colors.neutral[600], fontWeight: 500 }}>Web Storefront</span>
                        </Text>
                    </Space>
                </div>

                {/* Center: Financial Hero (The "Gravity" of the Order) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Text style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: colors.neutral[300],
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        marginBottom: '-4px'
                    }}>
                        GROSS SETTLEMENT
                    </Text>
                    <Title level={2} style={{
                        margin: 0,
                        fontSize: '36px',
                        fontFamily: 'monospace',
                        fontWeight: 300,
                        color: colors.secondary.main,
                        letterSpacing: '-0.05em'
                    }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                    </Title>
                </div>

                {/* Right side: Action Command Center */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                    <Space size={12}>
                        {/* Primary Semantic Action */}
                        {order.status === OrderStatusEnum.PENDING && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => handleUpdateStatus(OrderStatusEnum.CONFIRMED)}
                                style={{
                                    height: '48px',
                                    padding: '0 32px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    backgroundColor: colors.success.main,
                                    borderColor: colors.success.main,
                                    boxShadow: `0 8px 20px -6px ${colors.success.main}40`
                                }}
                            >
                                CONFIRM ORDER
                            </Button>
                        )}
                        {order.status === OrderStatusEnum.CONFIRMED && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => handleUpdateStatus(OrderStatusEnum.PROCESSING)}
                                style={{
                                    height: '48px',
                                    padding: '0 32px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    backgroundColor: colors.primary.main,
                                    boxShadow: `0 8px 20px -6px ${colors.primary.main}40`
                                }}
                            >
                                START PROCESSING
                            </Button>
                        )}
                        {order.status === OrderStatusEnum.PROCESSING && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => setTrackingModalVisible(true)}
                                icon={<CarOutlined />}
                                style={{
                                    height: '48px',
                                    padding: '0 32px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    backgroundColor: colors.info.main,
                                    borderColor: colors.info.main,
                                    boxShadow: `0 8px 20px -6px ${colors.info.main}40`
                                }}
                            >
                                SHIP CONSIGNMENT
                            </Button>
                        )}
                        {order.status === OrderStatusEnum.SHIPPING && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => handleUpdateStatus(OrderStatusEnum.DELIVERED)}
                                icon={<CheckCircleOutlined />}
                                style={{
                                    height: '48px',
                                    padding: '0 32px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    backgroundColor: colors.success.main,
                                    borderColor: colors.success.main,
                                    boxShadow: `0 8px 20px -6px ${colors.success.main}40`
                                }}
                            >
                                MARK AS DELIVERED
                            </Button>
                        )}
                        {order.status === OrderStatusEnum.DELIVERED && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => handleUpdateStatus(OrderStatusEnum.COMPLETED)}
                                icon={<CheckCircleOutlined />}
                                style={{
                                    height: '48px',
                                    padding: '0 32px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    backgroundColor: colors.primary.main,
                                    borderColor: colors.primary.main,
                                    boxShadow: `0 8px 20px -6px ${colors.primary.main}40`
                                }}
                            >
                                COMPLETE ORDER
                            </Button>
                        )}

                        {order.status === OrderStatusEnum.DELIVERED && (
                            <Button
                                danger
                                size="large"
                                onClick={() => handleUpdateStatus(OrderStatusEnum.RETURNED)}
                                icon={<CloseOutlined />}
                                style={{
                                    height: '48px',
                                    padding: '0 32px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                }}
                            >
                                LOGISTICS RETURN
                            </Button>
                        )}

                        {/* Ghost Utilities */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                                size="large"
                                icon={<PrinterOutlined />}
                                onClick={() => window.print()}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: colors.neutral[500]
                                }}
                            />
                            {onClose && (
                                <Button
                                    size="large"
                                    type="text"
                                    icon={<CloseOutlined style={{ fontSize: '20px' }} />}
                                    onClick={onClose}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        color: colors.neutral[300]
                                    }}
                                />
                            )}
                        </div>
                    </Space>
                </div>
            </div>

            {/* FAANG L8: Tonal Layering System */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 400px',
                height: 'calc(100% - 100px)',
                overflow: 'hidden'
            }}>
                {/* Primary Content Zone (Alpha) */}
                <div style={{
                    padding: '40px',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '48px'
                }}>
                    {/* Section: Line Items (Bespoke Table) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Title level={5} style={{
                            margin: 0,
                            fontFamily: typography.fontFamily.serif,
                            color: colors.neutral[900],
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            Line Items <span style={{ color: colors.neutral[300], fontSize: '13px', fontFamily: typography.fontFamily.sans }}>({order.items?.length || 0})</span>
                        </Title>
                        <Table
                            dataSource={order.items}
                            rowKey="id"
                            pagination={false}
                            className="luxury-static-table"
                            columns={[
                                {
                                    title: 'PRODUCT DETAIL',
                                    key: 'product',
                                    render: (_, item) => (
                                        <Space size={20}>
                                            <Avatar
                                                shape="square"
                                                size={80}
                                                src={item.thumbnailUrl}
                                                style={{
                                                    borderRadius: '12px',
                                                    border: `1px solid ${colors.neutral[100]}`,
                                                    overflow: 'hidden'
                                                }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <Text strong style={{ fontSize: '15px', color: colors.neutral[900] }}>{item.productName}</Text>
                                                <Text style={{ fontSize: '12px', color: colors.neutral[400], fontFamily: 'monospace' }}>SKU: {item.sku}</Text>
                                                {item.variantTitle && (
                                                    <Space size={4} wrap style={{ marginTop: '6px' }}>
                                                        {Object.entries(item.variantTitle).map(([key, val]) => (
                                                            <Tag key={key} style={{ fontSize: '10px', borderRadius: '4px', margin: 0, border: 'none', background: colors.neutral[50] }} color="default">{val as string}</Tag>
                                                        ))}
                                                    </Space>
                                                )}
                                            </div>
                                        </Space>
                                    ),
                                },
                                {
                                    title: 'UNIT PRICE',
                                    dataIndex: 'price',
                                    align: 'right',
                                    render: (v) => <Text style={{ color: colors.neutral[600], fontFamily: 'monospace' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}</Text>,
                                },
                                {
                                    title: 'QTY',
                                    dataIndex: 'quantity',
                                    align: 'center',
                                    render: (q) => <Text strong style={{ color: colors.neutral[900] }}>{q}</Text>
                                },
                                {
                                    title: 'SUBTOTAL',
                                    dataIndex: 'totalLine',
                                    align: 'right',
                                    render: (v) => <Text strong style={{ color: colors.primary.main, fontSize: '14px', fontFamily: 'monospace' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}</Text>,
                                },
                            ]}
                            style={{ border: 'none' }}
                        />

                        {/* Financial Breakdown (Recap) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '24px 0' }}>
                            <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text style={{ color: colors.neutral[400], fontSize: '13px' }}>Subtotal Value</Text>
                                    <Text style={{ fontFamily: 'monospace', fontSize: '13px' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subTotal)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text style={{ color: colors.neutral[400], fontSize: '13px' }}>Logistic Assessment</Text>
                                    <Text style={{ fontFamily: 'monospace', fontSize: '13px' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shippingFee)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text style={{ color: colors.neutral[400], fontSize: '13px' }}>Promotional Yield</Text>
                                    <Text style={{ fontFamily: 'monospace', fontSize: '13px', color: colors.error.main }}>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discountAmount)}</Text>
                                </div>
                                <Divider style={{ margin: '8px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <Text strong style={{ fontSize: '14px', color: colors.neutral[900] }}>NET TOTAL</Text>
                                    <Text strong style={{ fontSize: '20px', color: colors.primary.main, fontFamily: 'monospace' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</Text>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Financial Ledger (Modern Reconciliation) */}
                    <div style={{
                        backgroundColor: colors.background.surface,
                        borderRadius: '24px',
                        padding: '32px',
                        border: `1px solid ${colors.neutral[50]}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '32px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Title level={5} style={{ margin: 0, fontFamily: typography.fontFamily.serif }}>Financial Ledger</Title>
                                <Space size={16} split={<Divider type="vertical" />}>
                                    <Space size={8}>
                                        <WalletOutlined style={{ color: colors.neutral[400] }} />
                                        <Text style={{ fontSize: '13px', color: colors.neutral[500] }}>Method: <Text strong>{order.paymentMethod}</Text></Text>
                                    </Space>
                                    <Tag color={order.paymentStatus === 'paid' ? 'success' : 'warning'} bordered={false} style={{ borderRadius: '100px', fontWeight: 700 }}>
                                        {order.paymentStatus.toUpperCase()}
                                    </Tag>
                                </Space>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {order.paymentStatus === 'unpaid' && (
                                    <Button
                                        onClick={() => handleUpdateStatus(OrderStatusEnum.CONFIRMED)}
                                        style={{ borderRadius: '10px', height: '40px', fontWeight: 600 }}
                                    >
                                        Log Receipt
                                    </Button>
                                )}
                                {order.paymentStatus === 'paid' && (
                                    <Button
                                        danger
                                        ghost
                                        onClick={() => {
                                            setRefundAmount(Number(order.totalAmount));
                                            setRefundModalVisible(true);
                                        }}
                                        style={{ borderRadius: '10px', height: '40px', fontWeight: 600 }}
                                    >
                                        Initiate Refund
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Transaction Audit Trail */}
                        {order.transactions && order.transactions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {order.transactions.map((tx) => (
                                    <div key={tx.id} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto 120px 100px',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        border: `1px solid ${colors.neutral[100]}`
                                    }}>
                                        <Text style={{ fontSize: '12px', fontFamily: 'monospace', color: colors.neutral[400] }}>TX_{tx.transactionCode?.slice(-8) || tx.id.slice(-8)}</Text>
                                        <Tag style={{ border: 'none', background: colors.neutral[50], fontSize: '10px' }}>{tx.type.toUpperCase()}</Tag>
                                        <Text strong style={{ textAlign: 'right', fontSize: '13px' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}</Text>
                                        <Text style={{ textAlign: 'right', fontSize: '11px', color: colors.neutral[400] }}>{dayjs(tx.createdAt).format('DD MMM')}</Text>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No financial events logged" />
                        )}
                    </div>
                </div>

                {/* Secondary Context Zone (Gamma - Operational Sidecar) */}
                <div style={{
                    backgroundColor: colors.background.surface,
                    borderLeft: `1px solid ${colors.neutral[100]}`,
                    padding: '40px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '48px'
                }}>
                    {/* Section: Customer Profile */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Title level={5} style={{ margin: 0, fontFamily: typography.fontFamily.serif }}>Customer Intent</Title>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Avatar size={64} icon={<UserOutlined />} style={{ background: colors.primary.main, color: '#fff' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text strong style={{ fontSize: '18px' }}>{order.shippingAddress.fullName}</Text>
                                <Text style={{ fontSize: '13px', color: colors.neutral[400] }}>{order.user?.email || 'Guest Session'}</Text>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', padding: '20px', borderRadius: '16px', border: `1px solid ${colors.neutral[100]}` }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <Text style={{ fontSize: '10px', color: colors.neutral[300], fontWeight: 700, textTransform: 'uppercase' }}>Delivery Target</Text>
                                <Text style={{ fontSize: '13px', lineHeight: 1.6, color: colors.neutral[600] }}>
                                    {order.shippingAddress.address}, {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
                                </Text>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <Text style={{ fontSize: '10px', color: colors.neutral[300], fontWeight: 700, textTransform: 'uppercase' }}>Contact</Text>
                                <Text strong style={{ fontSize: '14px' }}>{order.shippingAddress.phone}</Text>
                            </div>
                        </div>
                    </div>

                    {/* Section: Operational Power Log */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Title level={5} style={{ margin: 0, fontFamily: typography.fontFamily.serif }}>Audit Trail</Title>
                            <Badge status="processing" text={<Text style={{ fontSize: '10px', color: colors.neutral[400] }}>LIVE TRACKING</Text>} />
                        </div>
                        <Timeline
                            reverse={true}
                            items={order.timelines?.map((t) => ({
                                dot: getTimelineIcon(t),
                                color: t.toStatus === order.status ? colors.primary.main : colors.neutral[200],
                                children: (
                                    <div style={{ paddingBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Text strong style={{ fontSize: '13px' }}>{t.action.replace('STATUS_UPDATE_', '').replace('_', ' ')}</Text>
                                            <Text style={{ fontSize: '11px', color: colors.neutral[400], fontFamily: 'monospace' }}>{dayjs(t.createdAt).format('HH:mm')}</Text>
                                        </div>
                                        <Text style={{ fontSize: '12px', color: colors.neutral[500], display: 'block', marginTop: '4px' }}>{t.description}</Text>
                                        {/* Actionable Timeline: High-end feature */}
                                        <Button type="link" size="small" style={{ padding: 0, height: 'auto', fontSize: '11px', marginTop: '8px' }}>
                                            Inspect Entry
                                        </Button>
                                    </div>
                                )
                            }))}
                        />
                    </div>
                </div>
            </div>

            {/* Hidden Printable Component */}
            <InvoicePrint order={order} />

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

            <Modal
                title="Treasury: Financial Refund"
                open={refundModalVisible}
                onOk={handleRefundOrder}
                onCancel={() => setRefundModalVisible(false)}
                okText="Process Refund"
                okButtonProps={{ danger: true, loading: refundMutation.isPending }}
                style={{ borderRadius: radius.lg }}
            >
                <Space orientation="vertical" style={{ width: '100%' }} size="large">
                    <div>
                        <Text type="secondary">Amount to be disbursed back to the original source.</Text>
                        <Input
                            type="number"
                            prefix="₫"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(Number(e.target.value))}
                            style={{ marginTop: '8px', borderRadius: radius.sm }}
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>Maximum refundable: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</Text>
                    </div>
                    <div>
                        <Text strong>Justification</Text>
                        <Input.TextArea
                            placeholder="Reason for refund (return, defect, billing error...)"
                            rows={3}
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            style={{ marginTop: '8px', borderRadius: radius.sm }}
                        />
                    </div>
                </Space>
            </Modal>
        </div>
    );
};

