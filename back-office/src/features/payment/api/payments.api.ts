import type { ApiResponse } from '@shared';
import { apiGet, apiPost } from '@/services/apiClient';

// Types
export interface Payment {
    id: string;
    orderId: string;
    transactionId: string | null;
    paymentMethod: 'COD' | 'VNPAY' | 'PAYPAL';
    amount: number;
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
    gatewayResponse: any;
    createdAt: string;
    updatedAt: string;
    order?: {
        id: string;
        code: string;
        totalAmount: number;
        user?: {
            email: string;
            fullName: string | null;
        };
    };
}

export interface Transaction {
    id: string;
    type: 'payment' | 'refund';
    status: string;
    provider: string;
    amount: number;
    createdAt: string;
}

export interface PaymentStatus {
    orderId: string;
    orderCode: string;
    paymentStatus: string;
    totalAmount: number;
    transactions: Transaction[];
}

export interface RefundPaymentDto {
    amount?: number;
    reason: string;
    restoreInventory?: boolean;
}

export interface ConfirmCODDto {
    orderId: string;
    amount: number;
    note?: string;
}

export interface RefundResult {
    refundTransactionId: string;
    amount: number;
    status: 'success' | 'failed';
    message: string;
}

// API Methods
export const paymentsApi = {
    /**
     * Get payment status for an order
     */
    getPaymentStatus: async (orderId: string): Promise<ApiResponse<PaymentStatus>> => {
        return apiGet<PaymentStatus>(`/api/payment/status/${orderId}`);
    },

    /**
     * Process refund for an order
     */
    refundPayment: async (
        orderId: string,
        data: RefundPaymentDto
    ): Promise<ApiResponse<RefundResult>> => {
        return apiPost<RefundResult>(`/api/payment/refund/${orderId}`, data);
    },

    /**
     * Confirm COD payment (staff only)
     */
    confirmCOD: async (data: ConfirmCODDto): Promise<ApiResponse<{ message: string }>> => {
        return apiPost<{ message: string }>('/api/payment/cod/confirm', data);
    },
};
