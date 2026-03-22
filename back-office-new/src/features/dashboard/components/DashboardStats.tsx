import React from 'react';
import { Row, Col, Statistic } from 'antd';
import {
    DollarOutlined,
    ShoppingCartOutlined,
    WarningOutlined,
    FundOutlined,
} from '@ant-design/icons';
import { GlassCard } from '@/shared/ui/GlassCard';
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
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
                <GlassCard 
                    bordered={false} 
                    loading={isLoading}
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(63, 134, 0, 0.05) 0%, rgba(255, 255, 255, 0.7) 100%)',
                        borderLeft: '4px solid #3f8600'
                    }}
                >
                    <Statistic
                        title="Total Revenue (Today)"
                        value={displayData.revenue}
                        precision={2}
                        valueStyle={{ color: '#3f8600', fontWeight: '800', fontSize: '24px' }}
                        prefix={<DollarOutlined />}
                        suffix="$"
                    />
                </GlassCard>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <GlassCard 
                    bordered={false} 
                    loading={isLoading}
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(255, 255, 255, 0.7) 100%)',
                        borderLeft: '4px solid #1890ff'
                    }}
                >
                    <Statistic
                        title="Orders Today"
                        value={displayData.ordersToday}
                        valueStyle={{ color: '#1890ff', fontWeight: '800', fontSize: '24px' }}
                        prefix={<ShoppingCartOutlined />}
                    />
                </GlassCard>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <GlassCard 
                    bordered={false} 
                    loading={isLoading}
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(207, 19, 34, 0.05) 0%, rgba(255, 255, 255, 0.7) 100%)',
                        borderLeft: '4px solid #cf1322'
                    }}
                >
                    <Statistic
                        title="Conversion Rate"
                        value={displayData.conversionRate}
                        precision={1}
                        valueStyle={{ color: '#cf1322', fontWeight: '800', fontSize: '24px' }}
                        prefix={<FundOutlined />}
                        suffix="%"
                    />
                </GlassCard>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <GlassCard 
                    bordered={false} 
                    loading={isLoading}
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(250, 173, 20, 0.05) 0%, rgba(255, 255, 255, 0.7) 100%)',
                        borderLeft: '4px solid #faad14'
                    }}
                >
                    <Statistic
                        title="Low Stock Alerts"
                        value={displayData.lowStockItems}
                        valueStyle={{ color: '#faad14', fontWeight: '800', fontSize: '24px' }}
                        prefix={<WarningOutlined />}
                    />
                </GlassCard>
            </Col>
        </Row>
    );
};
