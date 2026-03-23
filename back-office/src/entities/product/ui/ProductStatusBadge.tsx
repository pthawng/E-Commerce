import React from 'react';
import { Tag } from 'antd';

interface Props {
    status: 'active' | 'inactive';
    className?: string;
}

/**
 * Presentational component for Product Status
 * simple mapping: active → green, inactive → gray
 */
export const ProductStatusBadge = ({ status, className }: Props) => {
    const isActive = status === 'active';
    return (
        <Tag color={isActive ? 'success' : 'default'} className={className}>
            {isActive ? 'Active' : 'Inactive'}
        </Tag>
    );
};
