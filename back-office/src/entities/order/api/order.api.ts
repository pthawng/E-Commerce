import { api as axiosClient } from '@/shared/api/base';
import type { PaginatedResponse } from '@ecommerce/shared';
import type { Order, OrderFilters } from '../model/types';

/**
 * Order API Service
 * Enforces strict typing and utilizes centralized Axios instance with auto-unwrapping.
 */
export const orderApi = {
    /**
     * Get paginated list of orders with filters
     */
    getOrders: async (params?: OrderFilters): Promise<PaginatedResponse<Order>> => {
        // Clear empty/undefined params to avoid 400 Bad Request on some backends
        const cleanParams = params ? Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        ) : undefined;

        return axiosClient.get('/admin/orders', { params: cleanParams });
    },

    /**
     * Get single order by ID or Code
     */
    getOrder: async (idOrCode: string): Promise<Order> => {
        return axiosClient.get(`/admin/orders/${idOrCode}`);
    },

    /**
     * Update order status (Admin action)
     */
    updateStatus: async (id: string, data: { status: string; note?: string }): Promise<Order> => {
        return axiosClient.patch(`/admin/orders/${id}`, data);
    },

    /**
     * Cancel an order
     */
    cancelOrder: async (id: string, reason?: string): Promise<Order> => {
        return axiosClient.post(`/admin/orders/${id}/actions/cancel`, { reason });
    },

    /**
     * Refund an order
     */
    refundOrder: async (id: string, data: { amount: number; reason: string }): Promise<Order> => {
        return axiosClient.post(`/admin/orders/${id}/actions/refund`, data);
    },

    /**
     * Update tracking information
     */
    updateTracking: async (id: string, data: { trackingCode: string; estimatedDeliveryAt?: string }): Promise<Order> => {
        return axiosClient.patch(`/admin/orders/${id}/tracking`, data);
    },
    /**
     * Bulk Update status for multiple orders
     */
    bulkUpdateStatus: async (ids: string[], status: string): Promise<void> => {
        // Implementation could be a single bulk endpoint or parallel calls
        // For standard REST patterns without a dedicated bulk endpoint, we use parallelization:
        await Promise.all(ids.map(id => axiosClient.patch(`/admin/orders/${id}`, { status })));
    },
};
