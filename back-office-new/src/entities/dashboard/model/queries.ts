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
