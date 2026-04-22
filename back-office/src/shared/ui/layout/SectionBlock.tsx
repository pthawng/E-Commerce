import React from 'react';
import { typography } from '@/shared/design-system/typography';
import { colors } from '@/shared/design-system/colors';

interface SectionBlockProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    extra?: React.ReactNode;
    noPadding?: boolean;
}

export const SectionBlock: React.FC<SectionBlockProps> = ({
    title,
    description,
    children,
    extra,
    noPadding = false
}) => {
    return (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
            {(title || description || extra) && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 'var(--space-md)',
                    padding: '0 var(--space-xs)'
                }}>
                    <div>
                        {title && (
                            <h3 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontFamily: typography.fontFamily.serif,
                                color: colors.primary.main
                            }}>
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '13px',
                                color: colors.neutral[500]
                            }}>
                                {description}
                            </p>
                        )}
                    </div>
                    {extra && <div>{extra}</div>}
                </div>
            )}
            <div style={{ padding: noPadding ? 0 : undefined }}>
                {children}
            </div>
        </div>
    );
};
