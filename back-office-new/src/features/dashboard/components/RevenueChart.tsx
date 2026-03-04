import React from 'react';
import { Card } from 'antd';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const data = [
    { name: '00:00', revenue: 4000 },
    { name: '04:00', revenue: 3000 },
    { name: '08:00', revenue: 2000 },
    { name: '12:00', revenue: 2780 },
    { name: '16:00', revenue: 1890 },
    { name: '20:00', revenue: 2390 },
    { name: '23:59', revenue: 3490 },
];

export const RevenueChart: React.FC = () => {
    return (
        <Card title="Revenue Flow (Today)" bordered={false} style={{ height: '100%' }}>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
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
        </Card>
    );
};
