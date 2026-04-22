import React, { useState } from 'react';
import { TransactionFilters } from '../components/TransactionFilters';
import { TransactionTable } from '../components/TransactionTable';
import { useTransactions } from '@/entities/sales/model/queries';
import type { TransactionQueryParams } from '@/entities/sales/model/types';
import { PageContainer } from '@/app/layout/PageContainer';
import { LayoutStack } from '@/shared/ui';

export const TransactionsPage: React.FC = () => {
    const [filters, setFilters] = useState<TransactionQueryParams>({ page: 1, limit: 10 });

    const { data, isLoading } = useTransactions(filters);

    const handleFiltersChange = (newFilters: Partial<TransactionQueryParams>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return (
        <PageContainer>
            <LayoutStack>
                <TransactionFilters
                    onFiltersChange={handleFiltersChange}
                    loading={isLoading}
                />

                <TransactionTable
                    data={data?.items}
                    loading={isLoading}
                    total={data?.meta.totalItems}
                    currentPage={filters.page}
                    pageSize={filters.limit}
                    onPageChange={(page, pageSize) => handleFiltersChange({ page, limit: pageSize })}
                />
            </LayoutStack>
        </PageContainer>
    );
};
