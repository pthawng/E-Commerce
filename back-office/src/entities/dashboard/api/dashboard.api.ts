import { api } from '@/shared/api/base';
import type { DashboardStats, RevenuePoint, TopProduct, LowStockItem } from '../model/types';

export const dashboardApi = {
    /**
     * Get main KPI statistics
     */
    getStats: async (): Promise<DashboardStats> => {
        return api.get<DashboardStats>('/admin/dashboard/stats') as any;
    },

    /**
     * Get revenue chart data
     */
    getRevenue: async (range: string = '7d'): Promise<RevenuePoint[]> => {
        return api.get<RevenuePoint[]>('/admin/dashboard/revenue', { params: { range } }) as any;
    },

    /**
     * Get top products
     */
    getTopProducts: async (limit: number = 5): Promise<TopProduct[]> => {
        return api.get<TopProduct[]>('/admin/dashboard/top-products', { params: { limit } }) as any;
    },

    /**
     * Get recent orders
     */
    getRecentOrders: async (limit: number = 10): Promise<import('@/entities/order/model/types').Order[]> => {
        return api.get<import('@/entities/order/model/types').Order[]>('/admin/dashboard/recent-orders', { params: { limit } }) as any;
    },

    /**
     * Get low stock alerts
     */
    getLowStockAlerts: async (limit: number = 10): Promise<LowStockItem[]> => {
        return api.get<LowStockItem[]>('/admin/dashboard/low-stock', { params: { limit } }) as any;
    }
};
