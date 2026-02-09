import { type ReactNode } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import * as tokens from '@/ui/design-tokens';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${tokens.spacing.xxxl * 2}px ${tokens.spacing.xxl}px`,
            textAlign: 'center',
        }}>
            <div style={{
                fontSize: 48,
                color: tokens.neutral.borderLight,
                marginBottom: tokens.spacing.lg,
            }}>
                {icon || <InboxOutlined />}
            </div>

            <h3 style={{
                fontSize: tokens.typography.fontSize.md,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.neutral.textSecondary,
                margin: 0,
                marginBottom: tokens.spacing.xs,
            }}>
                {title}
            </h3>

            {description && (
                <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.neutral.textTertiary,
                    margin: 0,
                    marginBottom: action ? tokens.spacing.lg : 0,
                    maxWidth: 400,
                }}>
                    {description}
                </p>
            )}

            {action && <div>{action}</div>}
        </div>
    );
}
