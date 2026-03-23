import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { GlassCard } from '@/shared/ui/GlassCard';
import { useRevenueData } from '@/entities/dashboard/model/queries';

export const RevenueChart: React.FC = () => {
    const { data: revenueData, isLoading } = useRevenueData();

    // Map backend data to recharts format
    const chartData = revenueData?.map(item => ({
        name: item.date, // or format it if needed, e.g. .split('T')[0]
        revenue: item.amount
    })) || [];

    return (
        <GlassCard title="Revenue Flow (Today)" bordered={false} style={{ height: '100%' }} loading={isLoading}>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#1890ff" fill="#e6f7ff" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
};
