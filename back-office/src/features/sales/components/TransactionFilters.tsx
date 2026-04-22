import React from 'react';
import { Input, Select, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TransactionQueryParams } from '@/entities/sales/model/types';
import { FilterBar } from '@/shared/ui';

interface ITransactionFiltersProps {
    onFiltersChange: (filters: Partial<TransactionQueryParams>) => void;
    loading?: boolean;
}

export const TransactionFilters: React.FC<ITransactionFiltersProps> = ({
    onFiltersChange,
    loading,
}) => {
    return (
        <FilterBar>
            <Input
                placeholder="Tìm theo mã đơn hàng..."
                prefix={<SearchOutlined style={{ color: 'var(--color-neutral-400)' }} />}
                allowClear
                style={{ width: 250 }}
                onChange={(e) => onFiltersChange({ orderCode: e.target.value, page: 1 })}
            />

            <Select
                placeholder="Trạng thái"
                style={{ width: 150 }}
                allowClear
                onChange={(value) => onFiltersChange({ status: value, page: 1 })}
                options={[
                    { label: 'Thành công', value: 'success' },
                    { label: 'Đang xử lý', value: 'pending' },
                    { label: 'Thất bại', value: 'failed' },
                    { label: 'Hoàn tiền', value: 'reversed' },
                ]}
            />

            <Select
                placeholder="Cổng thanh toán"
                style={{ width: 150 }}
                allowClear
                onChange={(value) => onFiltersChange({ provider: value, page: 1 })}
                options={[
                    { label: 'VNPAY', value: 'VNPAY' },
                    { label: 'PAYPAL', value: 'PAYPAL' },
                    { label: 'COD', value: 'COD' },
                ]}
            />

            <Button
                icon={<ReloadOutlined />}
                onClick={() => onFiltersChange({ page: 1, limit: 10, status: undefined, provider: undefined, orderCode: undefined })}
                loading={loading}
            >
                Làm mới
            </Button>
        </FilterBar>
    );
};
