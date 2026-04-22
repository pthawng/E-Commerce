import React from 'react';
import {
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { HeroMetric, DashboardGrid } from '@/shared/ui';

interface OrderInsightsProps {
    onTriggerAction: (action: string, value?: any) => void;
    loading?: boolean;
}

/**
 * OrderInsights: FAANG L8 Decision Layer
 * Specialized KPIs that trigger specific focused workflows.
 */
export const OrderInsights: React.FC<OrderInsightsProps> = ({ onTriggerAction, loading }) => {
    // In a real system, these would come from useOrderStats()
    // For now, we mock the actionable triggers
    const stats = {
        pendingConfirmation: 12,
        overdue: 5,
        highValue: 8
    };

    return (
        <div style={{ marginBottom: '32px' }}>
            <DashboardGrid columns={{ xs: 1, sm: 3, lg: 3 }} gap="24px">
                <div
                    onClick={() => onTriggerAction('status', 'pending')}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                    <HeroMetric
                        label="Awaiting Confirmation"
                        value={stats.pendingConfirmation}
                        icon={<ExclamationCircleOutlined />}
                        loading={loading}
                        trend="Action Required"
                        trendDirection="down" // Representing a "bottleneck"
                    />
                </div>

                <div
                    onClick={() => onTriggerAction('urgent', true)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                    <HeroMetric
                        label="Priority Bottlenecks"
                        value={stats.overdue}
                        suffix="Overdue"
                        icon={<ClockCircleOutlined />}
                        loading={loading}
                        trend="> 24h PENDING"
                        trendDirection="down"
                    />
                </div>

                <div
                    onClick={() => onTriggerAction('high-value', 5000000)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                    <HeroMetric
                        label="High-Value Focus"
                        value={stats.highValue}
                        icon={<DollarOutlined />}
                        loading={loading}
                        trend="Ticket > 5M"
                        trendDirection="up"
                    />
                </div>
            </DashboardGrid>
        </div>
    );
};
