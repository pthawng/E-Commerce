import React from 'react';
import { Layout } from 'antd';
import { colors } from '@/shared/design-system/colors';

const { Content: AntContent } = Layout;

interface ContentProps {
    children: React.ReactNode;
}

export const Content: React.FC<ContentProps> = ({ children }) => {
    return (
        <AntContent
            style={{
                margin: '24px',
                padding: '24px',
                background: colors.background.surface,
                borderRadius: 12,
                minHeight: 280,
            }}
        >
            {children}
        </AntContent>
    );
};
