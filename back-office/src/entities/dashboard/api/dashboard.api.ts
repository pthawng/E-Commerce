import { api } from '@/shared/api/base';
import type { DashboardStats, RevenuePoint } from '../model/types';

export const dashboardApi = {
    /**
     * Get main KPI statistics
     */
    getStats: async (): Promise<DashboardStats> => {
        return api.get<DashboardStats>('/admin/dashboard/stats') as unknown as DashboardStats;
    },

    /**
     * Get revenue chart data
     */
    getRevenue: async (range: string = '7d'): Promise<RevenuePoint[]> => {
        return api.get<RevenuePoint[]>('/admin/dashboard/revenue', { params: { range } }) as unknown as RevenuePoint[];
    }
};
