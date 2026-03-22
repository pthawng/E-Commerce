import React from 'react';
import { Tag } from 'antd';

interface Props {
    isActive: boolean;
    className?: string;
}

/**
 * Presentational component for Product Status
 */
export const ProductStatusBadge = ({ isActive, className }: Props) => {
    return (
        <Tag color={isActive ? 'success' : 'default'} className={className}>
            {isActive ? 'Active' : 'Inactive'}
        </Tag>
    );
};
