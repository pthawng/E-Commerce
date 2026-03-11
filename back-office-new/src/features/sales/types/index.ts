import type { PaginationMeta } from '@/features/product/types';

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'reversed';
export type TransactionType = 'payment' | 'refund';

export interface PaymentTransaction {
    id: string;
    orderId: string;
    order?: {
        id: string;
        code: string;
    };
    amount: number;
    currency: string;
    type: TransactionType;
    status: TransactionStatus;
    provider: string;
    method: string | null;
    transactionCode: string | null;
    gatewayResponse: Record<string, any> | null;
    note: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedTransactions {
    items: PaymentTransaction[];
    meta: PaginationMeta;
}

export interface TransactionQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    provider?: string;
    orderCode?: string;
}
