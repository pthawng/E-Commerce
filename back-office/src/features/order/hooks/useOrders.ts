import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { ordersApi, type Order, type OrderStatus, type OrderListParams, type OrderListResponse } from '../api/orders.api';
import { message } from 'antd';

/**
 * Fetch orders list with filters
 */
export const useOrders = (params?: OrderListParams) => {
    return useQuery({
        queryKey: ['orders', params],
        queryFn: async () => {
            const response = await ordersApi.getAll(params);
            return response.data;
        },
    });
};

/**
 * Fetch single order by ID
 */
export const useOrder = (id: string, options?: Omit<UseQueryOptions<Order>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ['orders', id],
        queryFn: async () => {
            const response = await ordersApi.getById(id);
            return response.data!;
        },
        enabled: !!id,
        ...options,
    });
};

/**
 * Fetch order status with auto-refetch for pending_payment orders
 */
export const useOrderStatus = (
    id: string,
    options?: Omit<UseQueryOptions<OrderStatus>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: ['orders', id, 'status'],
        queryFn: async () => {
            const response = await ordersApi.getStatus(id);
            return response.data!;
        },
        enabled: !!id,
        ...options,
    });
};

/**
 * Cancel order mutation
 */
export const useCancelOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            const response = await ordersApi.cancel(id, reason);
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // Update single order cache
            queryClient.setQueryData(['orders', data.id], data);
            message.success('Order cancelled successfully');
        },
        onError: (error: any) => {
            message.error(error.message || 'Failed to cancel order');
        },
    });
};
