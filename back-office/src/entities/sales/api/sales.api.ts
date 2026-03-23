import { api } from '@/shared/api/base';
import type { PaginatedTransactions, TransactionQueryParams } from '../model/types';

export const salesApi = {
    getTransactions: (params?: TransactionQueryParams) =>
        api.get<PaginatedTransactions>('/payments/transactions', { params }),
};
