import React, { useState, useMemo, useEffect } from 'react';
import { Input, Button, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';
import { orderApi } from '@/entities/order/api/orderApi';
import { OrderStatusEnum, LuxurySegment, PaymentStatusEnum } from '@/shared/types/order.types';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';
import { WidgetErrorBoundary } from '@/shared/ui/ErrorBoundary/WidgetErrorBoundary';

// Widgets
import { OrderFulfillmentPulse } from '@/widgets/orders/ui/OrderFulfillmentPulse';
import { OrderOrchestrator } from '@/widgets/orders/ui/OrderOrchestrator';
import { OrderIntegrityDrawer } from '@/widgets/orders/ui/OrderIntegrityDrawer';
import { CreateOrderDrawer } from '@/widgets/orders/ui/CreateOrderDrawer';

dayjs.extend(relativeTime);

export const OMSPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation() as any;
    const queryClient = useQueryClient();
    const { convertAndFormat } = useCurrencyConverter();
    const [activeQueue, setActiveQueue] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(id || null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(!!id);
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

    useEffect(() => {
        if (id) {
            setSelectedOrderId(id);
            setIsDrawerVisible(true);
        }
    }, [id]);

    const handleCloseDrawer = () => {
        setIsDrawerVisible(false);
        setSelectedOrderId(null);
        navigate('/orders');
    };

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['admin-orders', activeQueue],
        queryFn: () => orderApi.getOrders({ limit: 100 }),
    });

    const { data: orderDetails, isLoading: isDetailsLoading } = useQuery({
        queryKey: ['admin-order', selectedOrderId],
        queryFn: () => orderApi.getOrder(selectedOrderId!),
        enabled: !!selectedOrderId,
    });

    usePageHeader({
        title: t('orders.title', { defaultValue: 'Orders' }),
        subtitle: t('orders.title', { defaultValue: 'Orders' }) + ' · ' + t('orders.orchestrator', { defaultValue: 'Orchestrator' }),
    });

    const transitionMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatusEnum }) =>
            orderApi.transitionStatus(id, status, 'Command Center Sync'),
        onSuccess: () => {
            message.success(t('dashboard.integrity.match_confirmed', { defaultValue: 'Verified' }));
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-order', selectedOrderId] });
        },
        onError: () => message.error(t('dashboard.integrity.audit_failed', { defaultValue: 'Action Failed' })),
    });

    const filteredOrders = useMemo(() => {
        if (!ordersData?.items) return [];
        let items = ordersData.items;

        if (searchText) {
            items = items.filter(
                o =>
                    o.code.toLowerCase().includes(searchText.toLowerCase()) ||
                    o.user?.fullName.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        switch (activeQueue) {
            case 'critical':
                return items.filter(o => {
                    const isVip =
                        o.user?.segment === LuxurySegment.VIP ||
                        o.user?.segment === LuxurySegment.VVIP ||
                        o.user?.segment === LuxurySegment.VIC;
                    const isOld = dayjs().diff(dayjs(o.createdAt), 'day') > 2;
                    return (isVip && o.paymentStatus === PaymentStatusEnum.unpaid) || (isOld && o.status !== OrderStatusEnum.COMPLETED);
                });
            case 'production':
                return items.filter(o =>
                    [
                        OrderStatusEnum.CONFIRMED,
                        OrderStatusEnum.MATERIAL_RESERVED,
                        OrderStatusEnum.IN_PRODUCTION,
                        OrderStatusEnum.QC,
                    ].includes(o.status as OrderStatusEnum)
                );
            case 'ready':
                return items.filter(o => o.status === OrderStatusEnum.READY_TO_SHIP);
            default:
                return items;
        }
    }, [ordersData, activeQueue, searchText]);

    const stats = useMemo(
        () => [
            {
                title: t('orders.stats.efficiency', { defaultValue: 'Efficiency' }),
                value: '94%',
                icon: <PlusOutlined />,
                color: 'text-green-500',
            },
            {
                title: t('orders.stats.backlog_valuation', { defaultValue: 'Backlog Valuation' }),
                value: convertAndFormat(filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)),
                icon: <PlusOutlined />,
                color: 'text-amber-600',
            },
            {
                title: t('dashboard.active_work_orders', { defaultValue: 'Work Orders' }),
                value: filteredOrders.filter(o => o.status !== OrderStatusEnum.COMPLETED).length,
                icon: <PlusOutlined />,
                color: 'text-blue-500',
            },
            {
                title: t('orders.stats.delivery_sla', { defaultValue: 'Delivery SLA' }),
                value: filteredOrders.filter(o => dayjs().diff(dayjs(o.createdAt), 'hour') > 24).length,
                icon: <PlusOutlined />,
                color: 'text-red-500',
            },
        ],
        [filteredOrders, convertAndFormat, t]
    );

    return (
        <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex justify-between items-center mb-8">
                <Input
                    prefix={<SearchOutlined className="text-gray-300" />}
                    placeholder={t('common.search_placeholder', { defaultValue: 'Search...' })}
                    className="h-10 w-80 border-gray-100 bg-transparent rounded-none text-[11px]"
                    onChange={e => setSearchText(e.target.value)}
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-10 px-8 bg-black dark:bg-[#d4af37] border-none uppercase tracking-widest text-[9px] font-bold"
                    onClick={() => setIsCreateDrawerOpen(true)}
                >
                    {t('orders.create_bespoke', { defaultValue: 'Create Bespoke' })}
                </Button>
            </div>

            <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title', { defaultValue: 'Error' })}>
                <OrderFulfillmentPulse stats={stats} />
            </WidgetErrorBoundary>

            <WidgetErrorBoundary fallbackTitle={t('common.error_boundary_title', { defaultValue: 'Error' })}>
                <OrderOrchestrator
                    orders={filteredOrders}
                    activeQueue={activeQueue}
                    onQueueChange={setActiveQueue}
                    isLoading={isLoading}
                    onViewOrder={id => {
                        setSelectedOrderId(id);
                        setIsDrawerVisible(true);
                        navigate(`/orders/${id}`);
                    }}
                    onTransition={(id, status) => transitionMutation.mutate({ id, status })}
                    convertAndFormat={convertAndFormat}
                />
            </WidgetErrorBoundary>

            <OrderIntegrityDrawer
                orderId={selectedOrderId}
                open={isDrawerVisible}
                onClose={handleCloseDrawer}
                orderDetails={orderDetails}
                isLoading={isDetailsLoading}
                onTransition={status => transitionMutation.mutate({ id: selectedOrderId!, status })}
                isTransitioning={transitionMutation.isPending}
                convertAndFormat={convertAndFormat}
            />

            <CreateOrderDrawer open={isCreateDrawerOpen} onClose={() => setIsCreateDrawerOpen(false)} />
        </div>
    );
};

export default OMSPage;
