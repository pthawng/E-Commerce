import React from 'react';
import { GlassCard } from '../GlassCard';
import { ResponsiveContainer } from 'recharts';
import { typography } from '@/shared/design-system/typography';

interface ChartCardProps {
    title?: string;
    loading?: boolean;
    children: React.ReactNode;
    height?: number | string;
    extra?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    loading,
    children,
    height = 300,
    extra
}) => {
    return (
        <GlassCard
            title={title && <span style={{ fontFamily: typography.fontFamily.serif, letterSpacing: '0.02em', textTransform: 'none' }}>{title}</span>}
            extra={extra}
            loading={loading}
            style={{ height: '100%' }}
        >
            <div style={{ width: '100%', height, minHeight: height }}>
                <ResponsiveContainer width="100%" height="100%">
                    {children as React.ReactElement}
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
};
