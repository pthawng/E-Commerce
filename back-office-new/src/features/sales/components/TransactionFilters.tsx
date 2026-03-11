import React from 'react';
import { Card, Input, Select, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TransactionQueryParams } from '../types';

interface ITransactionFiltersProps {
    onFiltersChange: (filters: Partial<TransactionQueryParams>) => void;
    loading?: boolean;
}

export const TransactionFilters: React.FC<ITransactionFiltersProps> = ({
    onFiltersChange,
    loading,
}) => {
    return (
        <Card className="mb-6 shadow-sm border-none bg-white/50 backdrop-blur-sm">
            <Space wrap size="middle" className="w-full">
                <Input
                    placeholder="Tìm theo mã đơn hàng..."
                    prefix={<SearchOutlined className="text-gray-400" />}
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
            </Space>
        </Card>
    );
};
