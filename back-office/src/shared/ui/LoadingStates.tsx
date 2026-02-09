import { Spin } from 'antd';
import * as tokens from '@/ui/design-tokens';

interface LoadingSpinnerProps {
    size?: 'small' | 'default' | 'large';
    tip?: string;
    fullPage?: boolean;
}

export function LoadingSpinner({ size = 'default', tip, fullPage = false }: LoadingSpinnerProps) {
    const content = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacing.md,
            padding: fullPage ? tokens.spacing.xxxl : tokens.spacing.xxl,
        }}>
            <Spin size={size} />
            {tip && (
                <div style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.neutral.textSecondary,
                }}>
                    {tip}
                </div>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {content}
            </div>
        );
    }

    return content;
}

interface SkeletonProps {
    rows?: number;
    avatar?: boolean;
}

export function Skeleton({ rows = 3, avatar = false }: SkeletonProps) {
    return (
        <div style={{ padding: tokens.spacing.xxl }}>
            {avatar && (
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: tokens.neutral.borderLight,
                    marginBottom: tokens.spacing.md,
                    animation: 'pulse 1.5s ease-in-out infinite',
                }} />
            )}
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height: 16,
                        backgroundColor: tokens.neutral.borderLight,
                        borderRadius: 4,
                        marginBottom: tokens.spacing.sm,
                        width: i === rows - 1 ? '60%' : '100%',
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: `${i * 0.1}s`,
                    }}
                />
            ))}
        </div>
    );
}
