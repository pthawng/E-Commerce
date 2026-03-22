import React from 'react';
import { Card, Input, Select, DatePicker } from 'antd';
import { OrderStatus as OrderStatusValue } from '@/entities/order/model/types';

const { Search } = Input;
const { RangePicker } = DatePicker;

interface OrderFiltersProps {
    onFiltersChange: (filters: Record<string, any>) => void;
    loading?: boolean;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({ onFiltersChange, loading }) => {
    return (
        <Card className="mb-4 shadow-sm border-0">
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[250px]">
                    <Search
                        placeholder="Tìm theo mã đơn hàng hoặc tên khách hàng..."
                        allowClear
                        onSearch={(value) => onFiltersChange({ search: value, page: 1 })}
                        style={{ width: '100%' }}
                        loading={loading}
                    />
                </div>

                <Select
                    placeholder="Trạng thái"
                    allowClear
                    className="w-[180px]"
                    onChange={(value) => onFiltersChange({ status: value, page: 1 })}
                    options={Object.values(OrderStatusValue).map((status) => ({
                        label: status.toUpperCase().replace('_', ' '),
                        value: status,
                    }))}
                />

                <RangePicker
                    className="w-[300px]"
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
            </div>
        </Card>
    );
};
