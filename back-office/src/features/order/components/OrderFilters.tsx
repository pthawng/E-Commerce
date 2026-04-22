import React from 'react';
import { Input, Select, DatePicker, Tag, Space, Divider, Button } from 'antd';
import { OrderStatus as OrderStatusValue } from '@/entities/order/model/types';
import { FilterBar } from '@/shared/ui';
import { colors } from '@/shared/design-system/colors';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { CheckableTag } = Tag;

interface OrderFiltersProps {
    filters: Record<string, any>;
    onFiltersChange: (filters: Record<string, any>) => void;
    loading?: boolean;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onFiltersChange, loading }) => {
    const quickFilters = [
        { label: 'High Value (> 5M)', key: 'highValue', value: 5000000 },
        { label: 'COD Payment', key: 'paymentMethod', value: 'COD' },
        { label: 'Express Delivery', key: 'shippingType', value: 'express' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FilterBar>
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <Search
                        placeholder="Search by Order ID, Customer, or Phone..."
                        allowClear
                        enterButton
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ search: e.target.value, page: 1 })}
                        onSearch={(value) => onFiltersChange({ search: value, page: 1 })}
                        style={{ width: '100%' }}
                        size="large"
                        loading={loading}
                    />
                </div>

                <Space size={12}>
                    <Select
                        placeholder="Select Status"
                        allowClear
                        dropdownStyle={{ borderRadius: '12px' }}
                        style={{ width: '200px' }}
                        size="large"
                        value={filters.status}
                        onChange={(value) => onFiltersChange({ status: value, page: 1 })}
                        options={Object.values(OrderStatusValue).map((status) => ({
                            label: status.toUpperCase().replace('_', ' '),
                            value: status,
                        }))}
                    />

                    <RangePicker
                        size="large"
                        style={{ width: '300px' }}
                        value={filters.startDate && filters.endDate ? [dayjs(filters.startDate), dayjs(filters.endDate)] : null}
                        onChange={(dates) => {
                            if (dates) {
                                onFiltersChange({
                                    startDate: dates[0]?.toISOString(),
                                    endDate: dates[1]?.toISOString(),
                                    page: 1
                                });
                            } else {
                                onFiltersChange({ startDate: undefined, endDate: undefined, page: 1 });
                            }
                        }}
                    />
                </Space>
            </FilterBar>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Refinement:
                </span>
                <Space size={8}>
                    {quickFilters.map((qf) => (
                        <CheckableTag
                            key={qf.key}
                            checked={filters[qf.key] === qf.value}
                            onChange={(checked) => onFiltersChange({ [qf.key]: checked ? qf.value : undefined, page: 1 })}
                            style={{
                                padding: '4px 16px',
                                borderRadius: '100px',
                                fontSize: '13px',
                                border: `1px solid ${filters[qf.key] === qf.value ? colors.primary.main : colors.neutral[100]}`,
                                backgroundColor: filters[qf.key] === qf.value ? `${colors.primary.main}10` : '#fff',
                                color: filters[qf.key] === qf.value ? colors.primary.main : colors.neutral[500],
                            }}
                        >
                            {qf.label}
                        </CheckableTag>
                    ))}
                </Space>

                {Object.keys(filters).length > 2 && ( // Assuming page and limit are always there
                    <>
                        <Divider type="vertical" />
                        <Button
                            type="link"
                            size="small"
                            onClick={() => onFiltersChange({ page: 1, limit: filters.limit })}
                            style={{ color: colors.neutral[400], fontSize: '12px' }}
                        >
                            Reset All Filters
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
