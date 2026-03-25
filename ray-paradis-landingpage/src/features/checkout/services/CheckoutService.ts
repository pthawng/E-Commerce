import { apiPost, apiGet } from '@/services/apiClient';
import { API_ENDPOINTS } from '@shared';

export interface CheckoutSnapshot {
    items: any[];
    totals: any;
    shippingMethods: any[];
}

export const CheckoutService = {
    /**
     * Step 1: Validate & Snapshot
     * Backend prepares the final pricing and stock check.
     */
    prepareCheckout: async (sessionId?: string): Promise<any> => {
        const response = await apiGet(API_ENDPOINTS.ORDERS.PREPARE_CHECKOUT, {
            headers: { 'x-client-session-id': sessionId }
        });
        return response.data;
    },

    /**
     * Step 2 & 3: Commit Order (and optionally initiate payment)
     */
    createOrder: async (data: any, idempotencyKey: string, sessionId?: string): Promise<any> => {
        const response = await apiPost(API_ENDPOINTS.ORDERS.BASE, data, {
            headers: { 
                'x-client-session-id': sessionId,
                'x-idempotency-key': idempotencyKey
            }
        });
        return response.data;
    },

    /**
     * Create order with integrated payment flow
     */
    createOrderWithPayment: async (data: any, idempotencyKey: string, sessionId?: string): Promise<any> => {
        const response = await apiPost(API_ENDPOINTS.ORDERS.CREATE_WITH_PAYMENT, data, {
            headers: { 
                'x-client-session-id': sessionId,
                'x-idempotency-key': idempotencyKey
            }
        });
        return response.data;
    }
};
