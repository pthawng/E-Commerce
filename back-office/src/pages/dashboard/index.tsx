import React from 'react';
import { PageContainer } from '@/app/layout/PageContainer';
import {
    LayoutStack,
    DashboardGrid,
    SectionBlock
} from '@/shared/ui';
import {
    DashboardStats,
    RevenueChart,
    RecentOrders,
    LowStockAlerts,
    TopProducts,
    SmartAssistant,
} from '@/features/dashboard';

export const DashboardPage: React.FC = () => {
    return (
        <PageContainer>
            <LayoutStack gap="var(--space-xl)">
                {/* P0: Command & Insights */}
                <SectionBlock title="Smart Assistant" description="AI-driven insights and pending actions.">
                    <SmartAssistant />
                </SectionBlock>

                {/* P1: Key Business Metrics */}
                <SectionBlock title="Performance Overview">
                    <DashboardStats />
                </SectionBlock>

                {/* P2: In-depth Analytics */}
                <SectionBlock title="Revenue & Sales Insights">
                    <DashboardGrid columns={{ xs: 1, lg: 2 }}>
                        <RevenueChart />
                        <TopProducts />
                    </DashboardGrid>
                </SectionBlock>

                {/* P3: Operational Pulse */}
                <SectionBlock title="Recent Transactions">
                    <RecentOrders hideTitle />
                </SectionBlock>

                <SectionBlock title="Inventory Health">
                    <LowStockAlerts hideTitle />
                </SectionBlock>
            </LayoutStack>
        </PageContainer>
    );
};

export default DashboardPage;
