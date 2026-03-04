import React from 'react';
import { Typography, Row, Col } from 'antd';
import {
    DashboardStats,
    RevenueChart,
    RecentOrders,
    LowStockAlerts,
    TopProducts,
} from '@/features/dashboard';

const { Title } = Typography;

export const DashboardPage: React.FC = () => {
    return (
        <div style={{ padding: '0 24px 24px 24px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0, color: '#0B2545' }}>Dashboard</Title>
            </div>

            <DashboardStats />

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={16}>
                    <RevenueChart />
                </Col>
                <Col xs={24} lg={8}>
                    <TopProducts />
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={12}>
                    <RecentOrders />
                </Col>
                <Col xs={24} lg={12}>
                    <LowStockAlerts />
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;
