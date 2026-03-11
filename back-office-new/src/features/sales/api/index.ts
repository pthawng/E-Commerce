import axiosClient from '@/shared/api/axiosClient';
import type { TransactionQueryParams, PaginatedTransactions } from '../types';

export const transactionApi = {
    /**
     * Admin: Get all transactions with filters
     */
    getAll: (filters: TransactionQueryParams) =>
        (axiosClient.get('/admin/payments', { params: filters }) as any).then((res: { data: any; meta: any }) => {
            return {
                items: res.data,
                meta: res.meta,
            } as PaginatedTransactions;
        }),
};
