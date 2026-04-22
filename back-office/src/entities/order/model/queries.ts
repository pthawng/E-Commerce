import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api/order.api';
import { message } from 'antd';
import type { OrderFilters, Order } from './types';

/**
 * Scalable Query Key Factory for Orders
 */
export const orderKeys = {
    all: ['orders'] as const,
    lists: (filters?: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
    details: (idOrCode: string) => [...orderKeys.all, 'detail', idOrCode] as const,
};

/**
 * Hook for fetching paginated orders
 */
export const useOrders = (params: OrderFilters = {}) => {
    return useQuery({
        queryKey: orderKeys.lists(params),
        queryFn: () => orderApi.getOrders(params),
    });
};

/**
 * Hook for fetching a single order
 */
export const useOrder = (idOrCode: string | null) => {
    return useQuery({
        queryKey: orderKeys.details(idOrCode || ''),
        queryFn: () => orderApi.getOrder(idOrCode!),
        enabled: !!idOrCode,
    });
};

/**
 * Mutation for updating order status
 */
export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
            orderApi.updateStatus(id, { status, note }),
        onSuccess: (order: Order) => {
            void message.success('Order status updated');
            void queryClient.invalidateQueries({ queryKey: orderKeys.details(order.id) });
            void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
        },
    });
};

/**
 * Mutation for updating tracking info
 */
export const useUpdateTracking = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, trackingCode, estimatedDeliveryAt }: { id: string; trackingCode: string; estimatedDeliveryAt?: string }) =>
            orderApi.updateTracking(id, { trackingCode, estimatedDeliveryAt }),
        onSuccess: (order: Order) => {
            void message.success('Tracking information updated');
            void queryClient.invalidateQueries({ queryKey: orderKeys.details(order.id) });
        },
    });
};

/**
 * Mutation for cancelling an order
 */
export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            orderApi.cancelOrder(id, reason),
        onSuccess: (order: Order) => {
            void message.success('Order cancelled successfully');
            void queryClient.invalidateQueries({ queryKey: orderKeys.details(order.id) });
            void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
        },
    });
};

/**
 * Mutation for refunding an order
 */
export const useRefundOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) =>
            orderApi.refundOrder(id, { amount, reason }),
        onSuccess: (order: Order) => {
            void message.success('Refund processed successfully');
            void queryClient.invalidateQueries({ queryKey: orderKeys.details(order.id) });
            void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
        },
    });
};
/**
 * Mutation for bulk updating order status
 */
export const useBulkUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
            orderApi.bulkUpdateStatus(ids, status),
        onSuccess: () => {
            void message.success('Bulk status update successful');
            void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
        },
    });
};
