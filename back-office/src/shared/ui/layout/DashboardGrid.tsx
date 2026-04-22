import React from 'react';

interface DashboardGridProps {
    children: React.ReactNode;
    columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
    gap?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
    children,
    columns = 12,
    gap = 'var(--space-lg)'
}) => {
    // Generate grid template columns based on responsiveness
    const getGridTemplate = () => {
        if (typeof columns === 'number') return `repeat(${columns}, 1fr)`;

        // Basic responsive logic for illustrative purposes
        // In a real project, we'd use CSS modules or a library like styled-components
        return `repeat(auto-fit, minmax(300px, 1fr))`;
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: getGridTemplate(),
            gap,
            width: '100%'
        }}>
            {children}
        </div>
    );
};
