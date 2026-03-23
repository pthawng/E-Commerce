import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
    title: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    const breadcrumbItems = items.map((item) => ({
        title: item.href ? <Link to={item.href}>{item.title}</Link> : item.title,
    }));

    return <AntBreadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />;
};
