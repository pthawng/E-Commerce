import { type ReactNode } from 'react';
import { pageHeaderStyle, headingStyles, textStyles } from '@/ui/styles';
import * as tokens from '@/ui/design-tokens';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

/**
 * PageHeader Component
 * 
 * Consistent page header with title, optional subtitle, and action buttons.
 * Follows luxury design system with muted colors and clean layout.
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div style={pageHeaderStyle}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: 1400,
                margin: '0 auto',
            }}>
                <div>
                    <h1 style={{
                        ...headingStyles.pageTitle,
                        marginBottom: subtitle ? 4 : 0,
                    }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p style={{
                            ...textStyles.subtitle,
                            margin: 0,
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && (
                    <div style={{ display: 'flex', gap: tokens.spacing.md }}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
