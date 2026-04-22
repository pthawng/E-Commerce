import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface LayoutContextType {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    sidebarWidth: number;
    topbarHeight: number;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    // Values matching variables.css defaults
    const sidebarWidth = collapsed ? 80 : 260;
    const topbarHeight = 64;

    useEffect(() => {
        // Sync with CSS variables for global reach without prop drilling
        document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
        document.documentElement.style.setProperty('--sidebar-collapsed-width', `80px`);
    }, [sidebarWidth]);

    return (
        <LayoutContext.Provider value={{ collapsed, setCollapsed, sidebarWidth, topbarHeight }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
