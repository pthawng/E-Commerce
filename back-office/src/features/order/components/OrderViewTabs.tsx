import React from 'react';
import { Tabs } from 'antd';
import { OrderStatus } from '@/entities/order/model/types';

interface OrderViewTabsProps {
    activeKey: string;
    onChange: (key: string) => void;
}

/**
 * OrderViewTabs: FAANG L8 Saved View Presets
 * Focuses the entire workspace on a specific domain state.
 */
export const OrderViewTabs: React.FC<OrderViewTabsProps> = ({ activeKey, onChange }) => {
    const items = [
        {
            key: 'all',
            label: 'All Orders',
        },
        {
            key: OrderStatus.PENDING,
            label: 'Pending',
        },
        {
            key: OrderStatus.SHIPPING,
            label: 'In Transit',
        },
        {
            key: OrderStatus.COMPLETED,
            label: 'Completed',
        },
        {
            key: 'urgent',
            label: 'Urgent Focus',
        },
    ];

    return (
        <Tabs
            activeKey={activeKey}
            onChange={onChange}
            items={items}
            style={{ marginBottom: '16px' }}
            tabBarStyle={{
                borderBottom: 'none',
                marginBottom: 0
            }}
        />
    );
};
