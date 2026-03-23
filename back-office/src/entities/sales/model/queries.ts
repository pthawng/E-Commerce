import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../api/sales.api';
import type { TransactionQueryParams } from './types';

export const salesKeys = {
    all: ['sales'] as const,
    transactions: (params?: TransactionQueryParams) => [...salesKeys.all, 'transactions', params] as const,
};

export const useTransactions = (params?: TransactionQueryParams) => {
    return useQuery({
        queryKey: salesKeys.transactions(params),
        queryFn: () => salesApi.getTransactions(params),
    });
};
