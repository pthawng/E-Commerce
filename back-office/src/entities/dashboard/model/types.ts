import type { ApiResponse } from '@ecommerce/shared';

export interface DashboardStats {
    revenue: number;
    ordersToday: number;
    lowStockItems: number;
    conversionRate: number;
}

export interface RevenuePoint {
    date: string;
    amount: number;
}

export type DashboardStatsResponse = ApiResponse<DashboardStats>;
export type RevenueResponse = ApiResponse<RevenuePoint[]>;
