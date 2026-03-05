import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api';
import type { OrderFilters } from '../types';
import { message } from 'antd';

export const useOrders = (filters: OrderFilters) => {
    return useQuery({
        queryKey: ['orders', filters],
        queryFn: () => orderApi.getAll(filters),
    });
};

export const useOrder = (id: string | null) => {
    return useQuery({
        queryKey: ['order', id],
        queryFn: () => orderApi.getById(id!),
        enabled: !!id,
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
            orderApi.updateStatus(id, { status, note }),
        onSuccess: (data: any) => {
            message.success(`Status updated for order ${data.code}`);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', data.id] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to update status');
        },
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            orderApi.cancel(id, reason),
        onSuccess: (data: any) => {
            message.success(`Order ${data.code} has been cancelled`);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', data.id] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to cancel order');
        },
    });
};

export const useUpdateTracking = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, trackingCode, estimatedDeliveryAt }: { id: string; trackingCode: string; estimatedDeliveryAt?: string }) =>
            orderApi.updateTracking(id, { trackingCode, estimatedDeliveryAt }),
        onSuccess: (data: any) => {
            message.success(`Tracking updated for order ${data.code}`);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', data.id] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to update tracking');
        },
    });
};
