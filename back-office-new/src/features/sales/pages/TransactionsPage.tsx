import React, { useState } from 'react';
import { Typography, Space } from 'antd';
import { TransactionFilters } from '../components/TransactionFilters';
import { TransactionTable } from '../components/TransactionTable';
import { useTransactions } from '../hooks';
import type { TransactionQueryParams } from '../types';
import { DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const TransactionsPage: React.FC = () => {
    const [filters, setFilters] = useState<TransactionQueryParams>({ page: 1, limit: 10 });

    const { data, isLoading } = useTransactions(filters);

    const handleFiltersChange = (newFilters: Partial<TransactionQueryParams>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-end">
                <Space direction="vertical" size={0}>
                    <Title level={3} style={{ margin: 0 }}>
                        <DollarOutlined className="mr-2 text-blue-600" />
                        Quản lý Giao dịch
                    </Title>
                    <Text type="secondary">Tra soát và quản lý mọi giao dịch thanh toán/hoàn tiền trên hệ thống</Text>
                </Space>
            </div>

            <TransactionFilters
                onFiltersChange={handleFiltersChange}
                loading={isLoading}
            />

            <TransactionTable
                data={data?.items}
                loading={isLoading}
                total={data?.meta.total}
                currentPage={filters.page}
                pageSize={filters.limit}
                onPageChange={(page, pageSize) => handleFiltersChange({ page, limit: pageSize })}
            />
        </div>
    );
};
