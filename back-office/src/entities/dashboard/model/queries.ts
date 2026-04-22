import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * Hook to fetch main KPI statistics
 */
export const useDashboardStats = () => {
    return useQuery({
        queryKey: queryKeys.dashboard.kpi,
        queryFn: dashboardApi.getStats,
        staleTime: 1000 * 60 * 5, // 5 mins
    });
};

/**
 * Hook to fetch revenue data for charts
 */
export const useRevenueData = (range: string = '7d') => {
    return useQuery({
        queryKey: queryKeys.dashboard.revenue(range),
        queryFn: () => dashboardApi.getRevenue(range),
        staleTime: 1000 * 60 * 10, // 10 mins
    });
};

/**
 * Hook to fetch top selling products
 */
export const useTopProducts = (limit: number = 5) => {
    return useQuery({
        queryKey: ['dashboard', 'top-products', limit],
        queryFn: () => dashboardApi.getTopProducts(limit),
        staleTime: 1000 * 60 * 15,
    });
};

/**
 * Hook to fetch recent orders for dashboard
 */
export const useRecentOrders = (limit: number = 10) => {
    return useQuery({
        queryKey: ['dashboard', 'recent-orders', limit],
        queryFn: () => dashboardApi.getRecentOrders(limit),
        staleTime: 1000 * 60,
    });
};

/**
 * Hook to fetch low stock alerts
 */
export const useLowStockAlerts = (limit: number = 10) => {
    return useQuery({
        queryKey: ['dashboard', 'low-stock', limit],
        queryFn: () => dashboardApi.getLowStockAlerts(limit),
        staleTime: 1000 * 60 * 5,
    });
};
