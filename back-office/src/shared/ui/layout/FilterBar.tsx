import React from 'react';
import { GlassCard } from '../GlassCard';

interface FilterBarProps {
    children: React.ReactNode;
}

/**
 * FilterBar: Stays consistent across all list pages.
 * Always wrapped in a GlassCard with standard bottom spacing.
 */
export const FilterBar: React.FC<FilterBarProps> = ({ children }) => {
    return (
        <GlassCard variant="borderless" style={{ marginBottom: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-4)', alignItems: 'center' }}>
                {children}
            </div>
        </GlassCard>
    );
};
