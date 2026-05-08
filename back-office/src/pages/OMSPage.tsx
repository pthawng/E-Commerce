import React, { useState, useMemo, useEffect } from 'react';
import { Input, Button, message } from 'antd';
import { PlusOutlined, SearchOutlined, GoldOutlined, TruckOutlined, RiseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrencyConverter } from '@/shared/lib/hooks/useCurrencyConverter';
import { orderApi } from '@/entities/order/api/orderApi';
import { OrderStatusEnum } from '@/shared/types/order.types';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';
import { WidgetErrorBoundary } from '@/shared/ui/ErrorBoundary/WidgetErrorBoundary';

// Widgets
import { OrderFulfillmentPulse } from '@/widgets/orders/ui/OrderFulfillmentPulse';
import { OrderOrchestrator } from '@/widgets/orders/ui/OrderOrchestrator';
import { OrderIntegrityDrawer } from '@/widgets/orders/ui/OrderIntegrityDrawer';
import { CreateOrderDrawer } from '@/widgets/orders/ui/CreateOrderDrawer';

export const OMSPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation() as any;
    const queryClient = useQueryClient();
    const { convertAndFormat } = useCurrencyConverter();
    const [activeQueue, setActiveQueue] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
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
        queryKey: ['admin-orders', activeQueue, currentPage, pageSize, searchText],
        queryFn: () =>
            orderApi.getOrders({
                page: currentPage,
                limit: pageSize,
                search: searchText.trim() || undefined,
                queue: activeQueue !== 'all' ? activeQueue : undefined,
            }),
        placeholderData: previousData => previousData,
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

    const filteredOrders = useMemo(() => ordersData?.items ?? [], [ordersData]);

    const { data: globalStats } = useQuery({
        queryKey: ['admin-orders-stats'],
        queryFn: () => orderApi.getStats(),
        refetchInterval: 30000,
    });

    const stats = useMemo(
        () => [
            {
                title: t('orders.stats.total_orders', { defaultValue: 'Total Orders' }),
                value: globalStats?.total || 0,
                icon: <PlusOutlined />,
                color: 'text-gray-400',
            },
            {
                title: t('dashboard.active_work_orders', { defaultValue: 'Processing' }),
                value: globalStats?.processing || 0,
                icon: <TruckOutlined />,
                color: 'text-blue-500',
            },
            {
                title: t('orders.stats.completed', { defaultValue: 'Completed' }),
                value: globalStats?.completed || 0,
                icon: <RiseOutlined />,
                color: 'text-green-500',
            },
            {
                title: t('orders.stats.issues', { defaultValue: 'Issues/Returns' }),
                value: globalStats?.issues || 0,
                icon: <ExclamationCircleOutlined />,
                color: 'text-red-500',
            },
            {
                title: t('orders.stats.backlog_valuation', { defaultValue: 'Backlog Valuation' }),
                value: convertAndFormat(globalStats?.backlogValuation || 0),
                icon: <GoldOutlined />,
                color: 'text-amber-600',
            },
            {
                title: t('orders.stats.delivery_sla', { defaultValue: 'SLA Variance' }),
                value: globalStats?.deliverySla || 0,
                icon: <ExclamationCircleOutlined />,
                color: 'text-orange-500',
            },
        ],
        [globalStats, convertAndFormat, t]
    );

    return (
        <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex justify-between items-center mb-8">
                <Input
                    prefix={<SearchOutlined className="text-gray-300" />}
                    placeholder={t('common.search_placeholder', { defaultValue: 'Search...' })}
                    className="h-10 w-80 border-gray-100 bg-transparent rounded-none text-[11px]"
                    onChange={e => {
                        setSearchText(e.target.value);
                        setCurrentPage(1);
                    }}
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
                    onQueueChange={key => {
                        setActiveQueue(key);
                        setCurrentPage(1);
                    }}
                    isLoading={isLoading}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={ordersData?.meta.totalItems ?? 0}
                    onPaginationChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }}
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
