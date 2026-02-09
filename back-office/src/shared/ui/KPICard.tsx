import { type ReactNode } from 'react';
import { Spin } from 'antd';
import * as tokens from '@/ui/design-tokens';

interface KPICardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    isLoading?: boolean;
}

export function KPICard({ title, value, icon, trend, isLoading }: KPICardProps) {
    return (
        <div style={{
            backgroundColor: tokens.neutral.surface,
            border: `1px solid ${tokens.neutral.borderLight}`,
            borderRadius: tokens.component.borderRadius.base,
            padding: tokens.spacing.xxl,
            transition: tokens.component.transition.fast,
        }}>
            {isLoading ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 100,
                }}>
                    <Spin />
                </div>
            ) : (
                <>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: tokens.spacing.md,
                    }}>
                        <span style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.medium,
                            color: tokens.neutral.textSecondary,
                        }}>
                            {title}
                        </span>
                        {icon && (
                            <span style={{
                                fontSize: 20,
                                color: tokens.neutral.textTertiary,
                            }}>
                                {icon}
                            </span>
                        )}
                    </div>

                    <div style={{
                        fontSize: 28,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        color: tokens.neutral.textPrimary,
                        marginBottom: tokens.spacing.xs,
                        lineHeight: 1.2,
                    }}>
                        {value}
                    </div>

                    {trend && (
                        <div style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: trend.isPositive ? '#5A7A5A' : '#8C5A5A',
                        }}>
                            <span style={{ marginRight: 4 }}>
                                {trend.isPositive ? '↑' : '↓'}
                            </span>
                            {Math.abs(trend.value)}% vs last month
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
