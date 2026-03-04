import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import {
    DollarOutlined,
    ShoppingCartOutlined,
    WarningOutlined,
    FundOutlined,
} from '@ant-design/icons';

// In a real app, this data would come from the API
const statsData = {
    revenue: 45231.89,
    ordersToday: 124,
    lowStockItems: 12,
    conversionRate: 3.4,
};

export const DashboardStats: React.FC = () => {
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
                <Card bordered={false}>
                    <Statistic
                        title="Total Revenue (Today)"
                        value={statsData.revenue}
                        precision={2}
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<DollarOutlined />}
                        suffix="$"
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card bordered={false}>
                    <Statistic
                        title="Orders Today"
                        value={statsData.ordersToday}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<ShoppingCartOutlined />}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card bordered={false}>
                    <Statistic
                        title="Conversion Rate"
                        value={statsData.conversionRate}
                        precision={1}
                        valueStyle={{ color: '#cf1322' }}
                        prefix={<FundOutlined />}
                        suffix="%"
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card bordered={false}>
                    <Statistic
                        title="Low Stock Alerts"
                        value={statsData.lowStockItems}
                        valueStyle={{ color: '#faad14' }}
                        prefix={<WarningOutlined />}
                    />
                </Card>
            </Col>
        </Row>
    );
};
