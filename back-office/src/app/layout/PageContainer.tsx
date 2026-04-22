import React from 'react';
import { Breadcrumb, Typography, Space } from 'antd';
import { useLocation, Link } from 'react-router-dom';
import styles from './PageContainer.module.css';

const { Title, Text } = Typography;

const breadcrumbNameMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/products': 'Products',
    '/products/create': 'Create',
    '/orders': 'Orders',
    '/users': 'Users',
    '/roles': 'Roles',
    '/permissions': 'Permissions',
    '/inventory': 'Inventory',
    '/categories': 'Categories',
    '/attributes': 'Attributes',
    '/transactions': 'Transactions',
};

export interface PageContainerProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
    breadcrumbItems?: any[];
}

export const PageContainer: React.FC<PageContainerProps> = ({
    title,
    description,
    action,
    children,
    breadcrumbItems: manualBreadcrumbs
}) => {
    const location = useLocation();
    const pathSnippets = location.pathname.split('/').filter((i) => i);

    const automatedBreadcrumbs = pathSnippets.map((_, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        return {
            title: breadcrumbNameMap[url] ? (
                index === pathSnippets.length - 1 ? (
                    breadcrumbNameMap[url]
                ) : (
                    <Link to={url}>{breadcrumbNameMap[url]}</Link>
                )
            ) : (
                index === pathSnippets.length - 1 ? _ : <Link to={url}>{_}</Link>
            ),
        };
    });

    const breadcrumbItems = manualBreadcrumbs || automatedBreadcrumbs;

    return (
        <div className={styles.container}>
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                {breadcrumbItems.length > 1 && (
                    <Breadcrumb items={breadcrumbItems} />
                )}

                {(title || action) && (
                    <div className={styles.header}>
                        <div className={styles.headerInfo}>
                            {title && (
                                <Title level={2} className={styles.title}>
                                    {title}
                                </Title>
                            )}
                            {description && (
                                <Text type="secondary" className={styles.description}>
                                    {description}
                                </Text>
                            )}
                        </div>
                        {action && <div>{action}</div>}
                    </div>
                )}

                <div className={styles.content}>
                    {children}
                </div>
            </Space>
        </div>
    );
};
