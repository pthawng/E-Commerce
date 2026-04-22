import React, { useEffect } from 'react';

interface SplitLayoutProps {
    children: React.ReactNode; // Main content (Left)
    detail?: React.ReactNode;  // Detail content (Right)
    isDetailOpen: boolean;
    onDetailClose: () => void;
    detailWidth?: number | string;
}

/**
 * SplitLayout: Standardizes the List/Detail interaction pattern.
 * Provides a sticky, performant detail panel that transitions contextually.
 */
export const SplitLayout: React.FC<SplitLayoutProps> = ({
    children,
    detail,
    isDetailOpen,
    onDetailClose,
    detailWidth = '450px'
}) => {
    // Handle Escape key to close detail panel
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isDetailOpen) onDetailClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isDetailOpen, onDetailClose]);

    return (
        <div style={{ position: 'relative', display: 'flex', width: '100%', minHeight: '100%' }}>
            {/* Main Content Area */}
            <div style={{
                flex: 1,
                width: '100%',
                transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginRight: isDetailOpen ? detailWidth : 0
            }}>
                {children}
            </div>

            {/* Detail Panel */}
            <aside
                style={{
                    position: 'fixed',
                    top: 'var(--topbar-height)',
                    right: 0,
                    bottom: 0,
                    width: detailWidth,
                    background: 'var(--color-background-surface)',
                    borderLeft: '1px solid var(--color-border-subtle)',
                    boxShadow: isDetailOpen ? 'var(--shadow-lg-inverse)' : 'none',
                    transform: isDetailOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 'var(--z-action-bar)' as any,
                    overflowY: 'auto'
                }}
            >
                {isDetailOpen && detail}
            </aside>

            {/* Scrim for focus (Optional) */}
            {isDetailOpen && (
                <div
                    onClick={onDetailClose}
                    style={{
                        position: 'fixed',
                        top: 'var(--topbar-height)',
                        left: 'var(--sidebar-width)',
                        right: detailWidth,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.02)',
                        zIndex: 750,
                        cursor: 'zoom-out'
                    }}
                />
            )}
        </div>
    );
};
