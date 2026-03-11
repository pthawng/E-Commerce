import { useQuery } from '@tanstack/react-query';
import { transactionApi } from '../api';
import type { TransactionQueryParams } from '../types';

export const useTransactions = (filters: TransactionQueryParams) => {
    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: () => transactionApi.getAll(filters),
    });
};
