import React from 'react';
import { Breadcrumb } from 'antd';

interface PageContainerProps {
    title?: string;
    children: React.ReactNode;
    breadcrumbItems?: { title: string; href?: string }[];
}

export const PageContainer: React.FC<PageContainerProps> = ({ title, children, breadcrumbItems }) => {
    return (
        <div style={{ padding: 0 }}>
            {breadcrumbItems && (
                <Breadcrumb
                    items={breadcrumbItems}
                    style={{ marginBottom: 16 }}
                />
            )}

            {title && (
                <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
                    {title}
                </h2>
            )}

            <div>{children}</div>
        </div>
    );
};
