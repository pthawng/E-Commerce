import React from 'react';

interface LayoutStackProps {
    children: React.ReactNode;
    gap?: number | string;
    direction?: 'vertical' | 'horizontal';
    align?: React.CSSProperties['alignItems'];
    justify?: React.CSSProperties['justifyContent'];
}

/**
 * LayoutStack: A foundational layout component to replace ad-hoc Tailwind flex/gap patterns.
 * Enforces consistent system spacing.
 */
export const LayoutStack: React.FC<LayoutStackProps> = ({
    children,
    gap = 'var(--spacing-8)', // Default 32px as per canonical standard
    direction = 'vertical',
    align = 'stretch',
    justify = 'flex-start'
}) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: direction === 'vertical' ? 'column' : 'row',
                gap: typeof gap === 'number' ? `${gap}px` : gap,
                alignItems: align,
                justifyContent: justify,
                width: '100%'
            }}
        >
            {children}
        </div>
    );
};
