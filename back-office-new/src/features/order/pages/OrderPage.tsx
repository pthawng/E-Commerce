import React, { useState } from 'react';
import { SplitLayout } from '@/shared/ui/SplitLayout';
import { OrderFilters } from '../components/OrderFilters';
import { OrderTable } from '../components/OrderTable';
import { OrderDetail } from '../components/OrderDetail';
import { useOrders, useOrder } from '../hooks';
import type { OrderFilters as IOrderFilters } from '../types';

export const OrderPage: React.FC = () => {
    const [filters, setFilters] = useState<IOrderFilters>({ page: 1, limit: 10 });
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const { data, isLoading } = useOrders(filters);
    const { data: selectedOrder, isLoading: isLoadingDetail } = useOrder(selectedOrderId);

    const handleFiltersChange = (newFilters: Partial<IOrderFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: newFilters.page || 1 }));
    };

    return (
        <div className="h-full flex flex-col">
            <OrderFilters
                onFiltersChange={handleFiltersChange}
                loading={isLoading}
            />

            <SplitLayout
                table={
                    <OrderTable
                        data={data?.items}
                        loading={isLoading}
                        total={data?.meta.total}
                        currentPage={filters.page}
                        pageSize={filters.limit}
                        onPageChange={(page, pageSize) => handleFiltersChange({ page, limit: pageSize })}
                        onRowClick={(order) => setSelectedOrderId(order.id)}
                        selectedRowId={selectedOrderId || undefined}
                    />
                }
                detail={
                    <OrderDetail
                        order={selectedOrder || null}
                        loading={isLoadingDetail}
                    />
                }
            />
        </div>
    );
};
