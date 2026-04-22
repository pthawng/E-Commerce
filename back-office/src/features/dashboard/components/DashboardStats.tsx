import React from 'react';
import {
    DollarOutlined,
    ShoppingCartOutlined,
    WarningOutlined,
    FundOutlined,
} from '@ant-design/icons';
import { DashboardGrid, HeroMetric } from '@/shared/ui';
import { useDashboardStats } from '@/entities/dashboard/model/queries';

export const DashboardStats: React.FC = () => {
    const { data: stats, isLoading } = useDashboardStats();

    const displayData = stats || {
        revenue: 0,
        ordersToday: 0,
        lowStockItems: 0,
        conversionRate: 0,
    };

    return (
        <DashboardGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
            <HeroMetric
                label="Revenue Today"
                value={displayData.revenue.toLocaleString()}
                prefix="$"
                icon={<DollarOutlined />}
                loading={isLoading}
                trend={displayData.revenueTrend?.value}
                trendDirection={displayData.revenueTrend?.direction}
            />
            <HeroMetric
                label="Orders Today"
                value={displayData.ordersToday}
                icon={<ShoppingCartOutlined />}
                loading={isLoading}
                trend={displayData.ordersTodayTrend?.value}
                trendDirection={displayData.ordersTodayTrend?.direction}
            />
            <HeroMetric
                label="Conversion"
                value={displayData.conversionRate}
                suffix="%"
                icon={<FundOutlined />}
                loading={isLoading}
                trend={displayData.conversionRateTrend?.value}
                trendDirection={displayData.conversionRateTrend?.direction}
            />
            <HeroMetric
                label="Low Stock"
                value={displayData.lowStockItems}
                icon={<WarningOutlined />}
                loading={isLoading}
                trend={displayData.lowStockItemsTrend?.value}
                trendDirection={displayData.lowStockItemsTrend?.direction}
            />
        </DashboardGrid>
    );
};
