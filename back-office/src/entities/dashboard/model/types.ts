import type { ApiResponse } from '@ecommerce/shared';

export interface MetricTrend {
    value: string;
    direction: 'up' | 'down';
}

export interface DashboardStats {
    revenue: number;
    revenueTrend?: MetricTrend;
    ordersToday: number;
    ordersTodayTrend?: MetricTrend;
    lowStockItems: number;
    lowStockItemsTrend?: MetricTrend;
    conversionRate: number;
    conversionRateTrend?: MetricTrend;
}

export interface RevenuePoint {
    date: string;
    amount: number;
}

export interface TopProduct {
    id: string;
    name: string;
    sales: number;
    revenue: number;
    avatar?: string;
}

export interface LowStockItem {
    id: string;
    productVariant: {
        sku: string;
        product: {
            name: {
                vi: string;
                en: string;
            };
        };
    };
    quantity: number;
}

export type DashboardStatsResponse = ApiResponse<DashboardStats>;
export type RevenueResponse = ApiResponse<RevenuePoint[]>;
