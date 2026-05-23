import { apiPost, apiGet } from '@/services/apiClient';
import { API_ENDPOINTS } from '@shared';

export interface CheckoutSnapshot {
    items: unknown[];
    totals: unknown;
    shippingMethods: unknown[];
}

export interface CreateOrderResponse {
    orderAccessToken?: string;
    orderId?: string;
    orderCode?: string;
    order?: {
        id: string;
        orderCode: string;
    };
    payment?: {
        paymentUrl?: string;
        metadata?: {
            transferCode?: string;
            qrUrl?: string;
            accountNo?: string;
            accountName?: string;
            note?: string;
            expiresAt?: string;
        };
    };
}

export const CheckoutService = {
    /**
     * Step 1: Validate & Snapshot
     * Backend prepares the final pricing, stock check and returns checkoutToken.
     */
    validateCheckout: async (): Promise<{ checkoutToken: string; snapshot: CheckoutSnapshot; expiresAt: string }> => {
        const response = await apiPost<{ checkoutToken: string; snapshot: CheckoutSnapshot; expiresAt: string }>(API_ENDPOINTS.ORDERS.VALIDATE_CHECKOUT, {});
        return response.data;
    },

    /**
     * Step 2.1: Get Payment Status
     * Returns real payment status from the backend.
     */
    getPaymentStatus: async (orderId: string): Promise<unknown> => {
        const response = await apiGet<unknown>(API_ENDPOINTS.PAYMENTS.STATUS(orderId));
        return response.data;
    },

    /**
     * Step 2: Create Order
     * Commits the order using the checkoutToken.
     * Idempotency is now handled server-side via checkoutToken.
     */
    createOrder: async (data: unknown): Promise<CreateOrderResponse> => {
        const response = await apiPost<CreateOrderResponse>(API_ENDPOINTS.ORDERS.BASE, data);
        return response.data;
    },

    /**
     * Step 3: Initiate Payment (for retries or manual trigger)
     */
    initiatePayment: async (orderId: string, paymentMethod: string): Promise<{ paymentUrl: string }> => {
        const response = await apiPost<{ paymentUrl: string }>(API_ENDPOINTS.ORDERS.INITIATE_PAYMENT, { orderId, paymentMethod });
        return response.data;
    },

    /**
     * Guest OTP: Request verification code
     */
    requestGuestOTP: async (email: string): Promise<{ message: string }> => {
        const response = await apiPost<{ message: string }>('/api/auth/guest/verify-request', { email });
        return response.data;
    },

    /**
     * Guest OTP: Verify code and get token
     */
    verifyGuestOTP: async (email: string, code: string): Promise<{ guestVerifyToken: string }> => {
        const response = await apiPost<{ guestVerifyToken: string }>('/api/auth/guest/verify-confirm', { email, code });
        return response.data;
    }
};
