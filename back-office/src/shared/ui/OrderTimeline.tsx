import { Timeline } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import * as tokens from '@/ui/design-tokens';

interface TimelineEvent {
    status: string;
    timestamp: string;
    description?: string;
}

interface OrderTimelineProps {
    currentStatus: string;
    events?: TimelineEvent[];
}

const STATUS_ORDER = [
    'pending_payment',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
];

const STATUS_INFO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending_payment: {
        label: 'Pending Payment',
        color: '#8B7355',
        icon: <ClockCircleOutlined />,
    },
    confirmed: {
        label: 'Confirmed',
        color: '#5A7A8C',
        icon: <CheckCircleOutlined />,
    },
    processing: {
        label: 'Processing',
        color: '#5A7A6B',
        icon: <CheckCircleOutlined />,
    },
    shipped: {
        label: 'Shipped',
        color: '#7A6B8C',
        icon: <CheckCircleOutlined />,
    },
    delivered: {
        label: 'Delivered',
        color: '#5A7A5A',
        icon: <CheckCircleOutlined />,
    },
    cancelled: {
        label: 'Cancelled',
        color: '#8C5A5A',
        icon: <CloseCircleOutlined />,
    },
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export function OrderTimeline({ currentStatus, events = [] }: OrderTimelineProps) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);

    const timelineItems = STATUS_ORDER.map((status, index) => {
        const info = STATUS_INFO[status];
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;

        // Find event for this status
        const event = events.find(e => e.status === status);

        return {
            dot: info.icon,
            color: isCurrent || isPast ? info.color : '#E5E5E5',
            children: (
                <div style={{ paddingBottom: 16 }}>
                    <div style={{
                        fontSize: 14,
                        fontWeight: isCurrent ? 600 : 500,
                        color: isCurrent || isPast ? tokens.neutral.textPrimary : tokens.neutral.textTertiary,
                        marginBottom: 4,
                    }}>
                        {info.label}
                        {isCurrent && (
                            <span style={{
                                marginLeft: 8,
                                fontSize: 11,
                                fontWeight: 500,
                                padding: '2px 8px',
                                borderRadius: 3,
                                backgroundColor: tokens.status[status as keyof typeof tokens.status]?.background || '#F0F0F0',
                                color: tokens.status[status as keyof typeof tokens.status]?.text || '#666',
                            }}>
                                Current
                            </span>
                        )}
                    </div>
                    {event && (
                        <div style={{
                            fontSize: 12,
                            color: tokens.neutral.textSecondary,
                        }}>
                            {formatDate(event.timestamp)}
                            {event.description && (
                                <div style={{ marginTop: 4, color: tokens.neutral.textTertiary }}>
                                    {event.description}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ),
        };
    }).filter((_, index) => {
        // If cancelled, only show up to cancelled status
        if (currentStatus === 'cancelled') {
            return index <= STATUS_ORDER.indexOf('cancelled');
        }
        // Otherwise show all statuses up to delivered
        return index <= STATUS_ORDER.indexOf('delivered');
    });

    return (
        <div style={{
            padding: tokens.spacing.xxl,
            backgroundColor: tokens.neutral.background,
            borderRadius: tokens.component.borderRadius.base,
            border: `1px solid ${tokens.neutral.borderLight}`,
        }}>
            <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: tokens.neutral.textPrimary,
                marginBottom: 20,
                marginTop: 0,
            }}>
                Order Timeline
            </h3>
            <Timeline items={timelineItems} />
        </div>
    );
}
