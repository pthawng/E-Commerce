import React from 'react';
import { GlassCard } from '../GlassCard';
import { typography } from '@/shared/design-system/typography';
import { colors } from '@/shared/design-system/colors';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface HeroMetricProps {
    label: string;
    value: string | number;
    prefix?: string;
    suffix?: string;
    trend?: string;
    trendDirection?: 'up' | 'down';
    icon?: React.ReactNode;
    loading?: boolean;
}

export const HeroMetric: React.FC<HeroMetricProps> = ({
    label,
    value,
    prefix,
    suffix,
    trend,
    trendDirection,
    icon,
    loading
}) => {
    return (
        <GlassCard loading={loading}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        color: colors.neutral[500],
                        textTransform: 'uppercase', // Force luxury caps
                        marginBottom: 'var(--space-sm)',
                        fontFamily: typography.fontFamily.sans
                    }}>
                        {label}
                    </div>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 600,
                        fontFamily: typography.fontFamily.serif,
                        color: colors.primary.main,
                        display: 'flex',
                        alignItems: 'center', // Center for stable visual alignment
                        gap: '1px',
                        letterSpacing: '-0.02em',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1
                    }}>
                        {prefix && (
                            <span style={{
                                fontSize: '20px',
                                color: colors.secondary.main,
                                fontWeight: 500,
                                transform: 'translateY(-1px)', // Fine-tuned vertical offset
                                marginRight: '2px'
                            }}>
                                {prefix}
                            </span>
                        )}
                        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
                        {suffix && (
                            <span style={{
                                fontSize: '14px',
                                color: colors.neutral[400],
                                fontWeight: 400,
                                marginLeft: '4px',
                                alignSelf: 'flex-end',
                                marginBottom: '2px'
                            }}>
                                {suffix}
                            </span>
                        )}
                    </div>
                    {trend && (
                        <div style={{
                            marginTop: 'var(--space-sm)',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: trendDirection === 'up' ? colors.success.main : colors.error.main
                        }}>
                            {trendDirection === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            {trend}
                            <span style={{ fontWeight: 400, color: colors.neutral[400], marginLeft: '2px' }}>vs last period</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        background: colors.secondary.light + '15', // 15 for subtle transparency
                        color: colors.secondary.main,
                        fontSize: '20px'
                    }}>
                        {icon}
                    </div>
                )}
            </div>
        </GlassCard>
    );
};
