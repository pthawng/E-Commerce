import React from 'react';
import { Space, Typography } from 'antd';
import { colors } from '@/shared/design-system/colors';

const { Title } = Typography;

interface PageLayoutProps {
    title?: string;
    description?: string;
    extra?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: number | string;
}

/**
 * Standard Page Layout for Rayparadis Backoffice.
 * Enforces consistent padding, header placement, and typography.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    description,
    extra,
    children,
    maxWidth = '100%'
}) => {
    return (
        <div style={{
            padding: '32px 40px',
            maxWidth: maxWidth,
            margin: '0 auto',
            minHeight: 'calc(100vh - var(--topbar-height))',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            {(title || extra) && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                }}>
                    <Space direction="vertical" size={4}>
                        {title && (
                            <Title level={2} style={{
                                margin: 0,
                                fontSize: '28px',
                                letterSpacing: '-0.02em',
                                color: colors.primary.main
                            }}>
                                {title}
                            </Title>
                        )}
                        {description && (
                            <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                                {description}
                            </Typography.Text>
                        )}
                    </Space>
                    {extra && <div style={{ paddingTop: '4px' }}>{extra}</div>}
                </div>
            )}

            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
};
