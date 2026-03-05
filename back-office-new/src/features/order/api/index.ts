import axiosClient from '@/shared/api/axiosClient';
import type { ApiResponse } from '@ecommerce/shared';
import type { Order, OrderFilters, PaginatedOrders } from '../types';

function unwrap<T>(envelope: unknown): T {
    return (envelope as ApiResponse<T>).data as T;
}

export const orderApi = {
    /**
     * Admin: Get all orders with filters
     */
    getAll: (filters: OrderFilters) =>
        (axiosClient.get('/admin/orders', { params: filters }) as any).then((res: { data: any; meta: any }) => {
            // Handle the flattened response structure from the backend interceptor
            return {
                items: res.data,
                meta: res.meta,
            } as PaginatedOrders;
        }),

    /**
     * Admin: Get order details by ID
     */
    getById: (id: string) =>
        axiosClient.get(`/admin/orders/${id}`).then(unwrap<Order>),

    /**
     * Admin: Update order status
     */
    updateStatus: (id: string, data: { status: string; note?: string }) =>
        axiosClient.patch(`/admin/orders/${id}`, data).then(unwrap<Order>),

    /**
     * Admin: Cancel order action
     */
    cancel: (id: string, reason?: string) =>
        axiosClient.post(`/admin/orders/${id}/actions/cancel`, { reason }).then(unwrap<Order>),

    /**
     * Admin: Update tracking info
     */
    updateTracking: (id: string, data: { trackingCode: string; estimatedDeliveryAt?: string }) =>
        axiosClient.patch(`/admin/orders/${id}/tracking`, data).then(unwrap<Order>),
};
