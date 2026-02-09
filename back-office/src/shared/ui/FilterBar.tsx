import { type ReactNode } from 'react';
import { filterBarStyle } from '@/ui/styles';
import * as tokens from '@/ui/design-tokens';

interface FilterBarProps {
    children: ReactNode;
}

/**
 * FilterBar Component
 * 
 * Consistent filter bar container with proper spacing and layout.
 * Automatically wraps filters on smaller screens.
 */
export function FilterBar({ children }: FilterBarProps) {
    return (
        <div style={filterBarStyle}>
            <div style={{
                display: 'flex',
                gap: tokens.spacing.md,
                maxWidth: 1400,
                margin: '0 auto',
                flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                {children}
            </div>
        </div>
    );
}
