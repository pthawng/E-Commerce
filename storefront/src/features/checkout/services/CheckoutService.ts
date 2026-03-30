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
     * Backend prepares the final pricing, stock check and returns checkoutToken.
     */
    validateCheckout: async (): Promise<{ checkoutToken: string; snapshot: CheckoutSnapshot; expiresAt: string }> => {
        const response = await apiPost(API_ENDPOINTS.ORDERS.VALIDATE_CHECKOUT, {});
        return response.data as { checkoutToken: string; snapshot: CheckoutSnapshot; expiresAt: string };
    },

    /**
     * Step 2.1: Get Payment Status
     * Returns real payment status from the backend.
     */
    getPaymentStatus: async (orderId: string): Promise<any> => {
        const response = await apiGet(API_ENDPOINTS.PAYMENTS.STATUS(orderId));
        return response.data;
    },

    /**
     * Step 2: Create Order
     * Commits the order using the checkoutToken.
     * Idempotency is now handled server-side via checkoutToken.
     */
    createOrder: async (data: any): Promise<any> => {
        const response = await apiPost(API_ENDPOINTS.ORDERS.BASE, data);
        return response.data;
    },

    /**
     * Step 3: Initiate Payment (for retries or manual trigger)
     */
    initiatePayment: async (orderId: string, paymentMethod: string): Promise<{ paymentUrl: string }> => {
        const response = await apiPost(API_ENDPOINTS.ORDERS.INITIATE_PAYMENT, { orderId, paymentMethod });
        return response.data as { paymentUrl: string };
    }
};
