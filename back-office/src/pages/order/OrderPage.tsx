import React, { useState } from 'react';
import { PageContainer } from '@/app/layout/PageContainer';
import { LayoutStack } from '@/shared/ui';
import { OrderFilters } from '@/features/order/components/OrderFilters';
import { OrderTable } from '@/features/order/components/OrderTable';
import { OrderDetail } from '@/features/order/components/OrderDetail';
import { OrderInsights } from '@/features/order/components/OrderInsights';
import { OrderViewTabs } from '@/features/order/components/OrderViewTabs';
import { useOrders, useOrder } from '@/entities/order/model/queries';
import type { OrderFilters as IOrderFilters } from '@/entities/order/model/types';
import { useUrlFilters } from '@/shared/hooks/useUrlFilters';
import { colors } from '@/shared/design-system/colors';
import { Modal } from 'antd';

export const OrderPage: React.FC = () => {
    const [filters, setFilters] = useUrlFilters<IOrderFilters & { urgent?: boolean; highValue?: number }>({
        page: 1,
        limit: 10,
        status: 'all' as any
    });

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const { data, isLoading } = useOrders(filters);
    const { data: selectedOrder, isLoading: isLoadingDetail } = useOrder(selectedOrderId);

    const handleFiltersChange = (newFilters: Partial<IOrderFilters & { urgent?: boolean; highValue?: number }>) => {
        setFilters({ ...newFilters, page: newFilters.page || 1 });
    };

    const handleInsightTrigger = (action: string, value: any) => {
        if (action === 'status') {
            handleFiltersChange({ status: value, urgent: undefined, highValue: undefined });
        } else if (action === 'urgent') {
            handleFiltersChange({ urgent: value, status: 'all' as any, highValue: undefined });
        } else if (action === 'high-value') {
            handleFiltersChange({ highValue: value, status: 'all' as any, urgent: undefined });
        }
    };

    const handleTabChange = (key: string) => {
        handleFiltersChange({
            status: key === 'all' || key === 'urgent' ? 'all' as any : key as any,
            urgent: key === 'urgent' ? true : undefined,
            page: 1
        });
    };

    return (
        <PageContainer
            title="Order Operations"
            description="Precision control over global order flow and operational bottlenecks."
        >
            <LayoutStack gap="32px">
                {/* L8 Decision Layer */}
                <OrderInsights
                    onTriggerAction={handleInsightTrigger}
                    loading={isLoading}
                />

                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    border: `1px solid ${colors.neutral[100]}`,
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)'
                }}>
                    {/* Operational Layer */}
                    <OrderViewTabs
                        activeKey={filters.urgent ? 'urgent' : (filters.status || 'all')}
                        onChange={handleTabChange}
                    />

                    <OrderFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        loading={isLoading}
                    />

                    <div style={{ marginTop: '24px' }}>
                        <OrderTable
                            data={data?.items}
                            total={data?.meta.totalItems}
                            currentPage={filters.page}
                            pageSize={filters.limit}
                            loading={isLoading}
                            onPageChange={(page, pageSize) => handleFiltersChange({ page, limit: pageSize })}
                            onRowClick={(order) => setSelectedOrderId(order.id)}
                            selectedRowId={selectedOrderId || undefined}
                        />
                    </div>
                </div>

                <Modal
                    open={!!selectedOrderId}
                    onCancel={() => setSelectedOrderId(null)}
                    footer={null}
                    width={1300}
                    centered
                    destroyOnClose
                    styles={{
                        body: {
                            padding: 0,
                            borderRadius: '16px',
                            overflow: 'hidden',
                            height: '85vh',
                        },
                        mask: {
                            backdropFilter: 'blur(12px)',
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        }
                    }}
                    closable={false}
                >
                    <OrderDetail
                        order={selectedOrder || null}
                        loading={isLoadingDetail}
                        onClose={() => setSelectedOrderId(null)}
                    />
                </Modal>
            </LayoutStack>
        </PageContainer>
    );
};
