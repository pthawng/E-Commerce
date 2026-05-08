import React, { memo, useMemo } from 'react';
import {
    Table,
    Tag,
    Avatar,
    Space,
    Button,
    Badge,
    Tabs,
    Typography,
    Progress,
    Tooltip,
    Dropdown,
    MenuProps,
} from 'antd';
import { AlertOutlined, ClockCircleOutlined, CheckCircleOutlined, MoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    OrderStatusEnum,
    ORDER_STATUS_CONFIG,
    PAYMENT_STATUS_CONFIG,
    VALID_TRANSITIONS,
    LUXURY_SEGMENT_CONFIG,
    LuxurySegment,
    PaymentStatusEnum,
} from '@/shared/types/order.types';
import { OrderListItem } from '@/entities/order/api/orderApi';
import type { TablePaginationConfig } from 'antd/es/table';

const { Text } = Typography;

dayjs.extend(relativeTime);

interface OrderOrchestratorProps {
    orders: OrderListItem[];
    activeQueue: string;
    onQueueChange: (key: string) => void;
    isLoading: boolean;
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (page: number, pageSize: number) => void;
    onViewOrder: (id: string) => void;
    onTransition: (id: string, status: OrderStatusEnum) => void;
    convertAndFormat: (val: number) => string;
}

export const OrderOrchestrator: React.FC<OrderOrchestratorProps> = memo(
    ({
        orders,
        activeQueue,
        onQueueChange,
        isLoading,
        currentPage,
        pageSize,
        totalItems,
        onPaginationChange,
        onViewOrder,
        onTransition,
        convertAndFormat,
    }) => {
        const { t } = useTranslation() as any;

        const getUrgencySignal = (record: OrderListItem) => {
            const hoursOld = dayjs().diff(dayjs(record.createdAt), 'hour');
            if (record.status !== OrderStatusEnum.COMPLETED && record.status !== OrderStatusEnum.CANCELLED) {
                if (hoursOld > 48)
                    return (
                        <Tooltip title={t('dashboard.issues')}>
                            <AlertOutlined className="text-red-500 animate-pulse" />
                        </Tooltip>
                    );
                if (hoursOld > 12)
                    return (
                        <Tooltip title={t('dashboard.pipeline_alerts')}>
                            <ClockCircleOutlined className="text-orange-400" />
                        </Tooltip>
                    );
            }
            return null;
        };

        const getProgress = (status: OrderStatusEnum) => {
            const steps: Record<string, number> = {
                [OrderStatusEnum.PENDING_PAYMENT]: 10,
                [OrderStatusEnum.CONFIRMED]: 25,
                [OrderStatusEnum.MATERIAL_RESERVED]: 40,
                [OrderStatusEnum.IN_PRODUCTION]: 60,
                [OrderStatusEnum.QC]: 80,
                [OrderStatusEnum.READY_TO_SHIP]: 95,
                [OrderStatusEnum.SHIPPED]: 100,
                [OrderStatusEnum.DELIVERED]: 100,
                [OrderStatusEnum.COMPLETED]: 100,
            };
            return steps[status] || 0;
        };

        const columns = useMemo(
            () => [
                {
                    title: <Text className="text-[10px] uppercase tracking-widest font-bold">{t('dashboard.table.reference')}</Text>,
                    key: 'ref',
                    width: 180,
                    render: (_: any, record: OrderListItem) => (
                        <Space size="middle">
                            {getUrgencySignal(record)}
                            <div className="flex flex-col">
                                <Text className="text-[11px] font-bold tracking-widest text-[#0e2258] dark:text-[#d4af37] uppercase">
                                    {record.code}
                                </Text>
                                <Text className="text-[9px] text-gray-400">{dayjs(record.createdAt).fromNow()}</Text>
                            </div>
                        </Space>
                    ),
                },
                {
                    title: <Text className="text-[10px] uppercase tracking-widest font-bold">{t('orders.drawer.customer')}</Text>,
                    key: 'client',
                    render: (_: any, record: OrderListItem) => {
                        const segment = (record.user?.segment as LuxurySegment) || LuxurySegment.PROSPECT;
                        const config = LUXURY_SEGMENT_CONFIG[segment] || LUXURY_SEGMENT_CONFIG.PROSPECT;
                        return (
                            <Space size="middle">
                                <Badge dot={segment === LuxurySegment.VIC} color="red">
                                    <Avatar size="small" shape="square" className="bg-gray-100 text-[9px] font-bold text-gray-400">
                                        {record.user?.fullName?.[0] || record.guestFullName?.[0] || 'G'}
                                    </Avatar>
                                </Badge>
                                <div className="flex flex-col" onClick={() => onViewOrder(record.id)} style={{ cursor: 'pointer' }}>
                                    <div className="flex items-center gap-2">
                                        <Text className="text-xs font-serif font-medium">
                                            {record.user?.fullName || record.guestFullName || t('dashboard.patron_default')}
                                        </Text>
                                        <Tag color={config.color} className="text-[8px] uppercase font-bold border-none px-1 h-4 leading-4 m-0">
                                            {config.label}
                                        </Tag>
                                    </div>
                                    <Text className="text-[9px] text-gray-400">{record.user?.email || record.guestEmail}</Text>
                                </div>
                            </Space>
                        );
                    },
                },
                {
                    title: <Text className="text-[10px] uppercase tracking-widest font-bold">{t('common.status')}</Text>,
                    key: 'status',
                    render: (_: any, record: OrderListItem) => {
                        const config = ORDER_STATUS_CONFIG[record.status as OrderStatusEnum] || ORDER_STATUS_CONFIG.PENDING_PAYMENT;
                        return (
                            <div className="flex flex-col gap-1 w-40">
                                <div className="flex justify-between items-center">
                                    <Tag color={config.color} className="rounded-none text-[8px] uppercase font-bold px-1.5 border-none m-0">
                                        {config.label}
                                    </Tag>
                                    <Text className="text-[9px] text-gray-300 italic">{getProgress(record.status as OrderStatusEnum)}%</Text>
                                </div>
                                <Progress
                                    percent={getProgress(record.status as OrderStatusEnum)}
                                    showInfo={false}
                                    size="small"
                                    strokeColor={config.color === 'default' ? '#d9d9d9' : undefined}
                                />
                            </div>
                        );
                    },
                },
                {
                    title: <Text className="text-[10px] uppercase tracking-widest font-bold">{t('orders.drawer.financials')}</Text>,
                    key: 'finance',
                    render: (_: any, record: OrderListItem) => {
                        const config =
                            PAYMENT_STATUS_CONFIG[record.paymentStatus as PaymentStatusEnum] || PAYMENT_STATUS_CONFIG.unpaid;
                        return (
                            <div className="flex flex-col">
                                <Text className="text-sm font-serif font-light">{convertAndFormat(record.totalAmount)}</Text>
                                <div className="flex items-center gap-1">
                                    <Badge status={record.paymentStatus === 'paid' ? 'success' : 'error'} className="scale-75" />
                                    <Text
                                        className={`text-[9px] uppercase tracking-widest font-bold ${
                                            record.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-500'
                                        }`}
                                    >
                                        {config.label}
                                    </Text>
                                </div>
                            </div>
                        );
                    },
                },
                {
                    title: <Text className="text-[10px] uppercase tracking-widest font-bold">{t('common.actions')}</Text>,
                    key: 'actions',
                    align: 'right' as const,
                    render: (_: any, record: OrderListItem) => {
                        const transitions = VALID_TRANSITIONS[record.status as OrderStatusEnum] || [];
                        const menuItems: MenuProps['items'] = transitions.map(status => ({
                            key: status,
                            label: `${t('common.edit')} -> ${(ORDER_STATUS_CONFIG[status as OrderStatusEnum] || {}).label}`,
                            onClick: (e: any) => {
                                e.domEvent.stopPropagation();
                                onTransition(record.id, status as OrderStatusEnum);
                            },
                        }));
                        return (
                            <Space size="small">
                                {transitions.length > 0 ? (
                                    <Button
                                        size="small"
                                        type="primary"
                                        className="bg-black dark:bg-[#d4af37] border-none text-[9px] uppercase font-bold tracking-widest h-7"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onTransition(record.id, transitions[0] as OrderStatusEnum);
                                        }}
                                    >
                                        {(ORDER_STATUS_CONFIG[transitions[0] as OrderStatusEnum] || {}).label}
                                    </Button>
                                ) : (
                                    <Button size="small" icon={<CheckCircleOutlined />} disabled className="text-[9px] h-7">
                                        {t('dashboard.archival_intelligence')}
                                    </Button>
                                )}
                                <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                                    <Button size="small" icon={<MoreOutlined />} className="h-7" onClick={e => e.stopPropagation()} />
                                </Dropdown>
                            </Space>
                        );
                    },
                },
            ],
            [convertAndFormat, onTransition, onViewOrder, t]
        );

        const items = [
            {
                key: 'all',
                label: <span className="px-4 uppercase tracking-[0.2em] text-[10px] font-bold">{t('orders.queue.live_feed')}</span>,
            },
            {
                key: 'critical',
                label: (
                    <span className="px-4 uppercase tracking-[0.2em] text-[10px] font-bold flex items-center gap-2">
                        <Badge dot status="error" /> {t('orders.queue.critical')}
                    </span>
                ),
            },
            {
                key: 'production',
                label: (
                    <span className="px-4 uppercase tracking-[0.2em] text-[10px] font-bold">{t('orders.queue.production')}</span>
                ),
            },
        ];

        return (
            <div className="space-y-4">
                <Tabs activeKey={activeQueue} onChange={onQueueChange} className="luxury-tabs-alt" items={items} />
                <Table
                    dataSource={orders}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        current: currentPage,
                        pageSize,
                        total: totalItems,
                        showSizeChanger: true,
                        pageSizeOptions: [15, 30, 50, 100],
                    }}
                    onChange={(pagination: TablePaginationConfig) => {
                        onPaginationChange(pagination.current || 1, pagination.pageSize || pageSize);
                    }}
                    onRow={record => ({
                        onClick: () => onViewOrder(record.id),
                        className: 'cursor-pointer hover:bg-gray-50/50 transition-colors',
                    })}
                    className="luxury-table-command border border-gray-100 dark:border-gray-900"
                />
            </div>
        );
    }
);
