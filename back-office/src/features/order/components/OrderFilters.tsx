import React from 'react';
import { Input, Select, DatePicker } from 'antd';
import { OrderStatus as OrderStatusValue } from '@/entities/order/model/types';
import { FilterBar } from '@/shared/ui';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;

interface OrderFiltersProps {
    filters: Record<string, any>;
    onFiltersChange: (filters: Record<string, any>) => void;
    loading?: boolean;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onFiltersChange, loading }) => {
    return (
        <FilterBar>
            <div style={{ flex: 1, minWidth: '250px' }}>
                <Search
                    placeholder="Search by order ID or customer name..."
                    allowClear
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ search: e.target.value, page: 1 })}
                    onSearch={(value) => onFiltersChange({ search: value, page: 1 })}
                    style={{ width: '100%' }}
                    loading={loading}
                />
            </div>

            <Select
                placeholder="Status"
                allowClear
                style={{ width: '180px' }}
                value={filters.status}
                onChange={(value) => onFiltersChange({ status: value, page: 1 })}
                options={Object.values(OrderStatusValue).map((status) => ({
                    label: status.toUpperCase().replace('_', ' '),
                    value: status,
                }))}
            />

            <RangePicker
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
        </FilterBar>
    );
};
