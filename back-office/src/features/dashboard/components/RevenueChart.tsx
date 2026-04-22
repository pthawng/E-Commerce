import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartCard } from '@/shared/ui';
import { chartTheme, chartGradients } from '@/shared/design-system/ChartTheme';
import { useRevenueData } from '@/entities/dashboard/model/queries';

export const RevenueChart: React.FC = () => {
    const { data: revenueData, isLoading } = useRevenueData();

    const chartData = revenueData?.map(item => ({
        name: item.date,
        revenue: item.amount
    })) || [];

    return (
        <ChartCard title="Revenue Flow" loading={isLoading}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id={chartGradients.primary.id} x1="0" y1="0" x2="0" y2="1">
                        {chartGradients.primary.stops.map((stop, i) => (
                            <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                        ))}
                    </linearGradient>
                </defs>
                <CartesianGrid {...chartTheme.grid} />
                <XAxis dataKey="name" {...chartTheme.xAxis} />
                <YAxis {...chartTheme.yAxis} tickFormatter={(value) => `$${value.toLocaleString('en-US')}`} />
                <Tooltip
                    {...chartTheme.tooltip}
                    formatter={(value?: number) => [value !== undefined ? `$${value.toLocaleString('en-US')}` : '—', 'Revenue']}
                />
                <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartGradients.primary.stops[0].color}
                    fill={`url(#${chartGradients.primary.id})`}
                    {...chartTheme.area}
                />
            </AreaChart>
        </ChartCard>
    );
};
