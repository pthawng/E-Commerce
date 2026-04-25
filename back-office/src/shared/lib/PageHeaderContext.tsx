import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface BreadcrumbSegment {
    label: ReactNode;
    path?: string;
}

export interface PageHeaderState {
    title: ReactNode;
    subtitle?: ReactNode;
    breadcrumbs?: BreadcrumbSegment[];
    actions?: ReactNode;
    isLoading?: boolean;
}

interface PageHeaderContextType {
    header: PageHeaderState;
    setHeader: (state: PageHeaderState) => void;
    resetHeader: () => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export const PageHeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [header, setHeaderState] = useState<PageHeaderState>({
        title: '',
    });

    const setHeader = useCallback((state: PageHeaderState) => {
        setHeaderState(state);
    }, []);

    const resetHeader = useCallback(() => {
        setHeaderState({ title: '' });
    }, []);

    return (
        <PageHeaderContext.Provider value={{ header, setHeader, resetHeader }}>
            {children}
        </PageHeaderContext.Provider>
    );
};

export const usePageHeader = (config?: PageHeaderState) => {
    const context = useContext(PageHeaderContext);
    if (!context) {
        throw new Error('usePageHeader must be used within a PageHeaderProvider');
    }

    const { setHeader, resetHeader, header } = context;

    React.useEffect(() => {
        if (config) {
            setHeader(config);
        }
        // No cleanup here to avoid flickering on fast transitions
        // Resetting is handled by the next page's usePageHeader or manually
    }, [config, setHeader]);

    return { setHeader, resetHeader, currentHeader: header };
};
