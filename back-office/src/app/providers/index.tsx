import React from 'react';
import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/api/queryClient';
import { themeConfig } from '@/shared/design-system/theme';

interface AppProvidersProps {
    children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <ConfigProvider theme={themeConfig}>
                {children}
            </ConfigProvider>
        </QueryClientProvider>
    );
};
