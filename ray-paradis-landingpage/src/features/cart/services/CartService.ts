import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/apiClient';
import { API_ENDPOINTS } from '@shared';

const SESSION_KEY = 'rp_cart_session';

/**
 * Cart Service
 * Handles data fetching and mutation with the backend.
 * Pricing authority is moved to the backend.
 */
export const CartService = {
    /**
     * Get or create a persistent guest session ID
     */
    getSessionId: (): string => {
        let sessionId = localStorage.getItem(SESSION_KEY);
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            localStorage.setItem(SESSION_KEY, sessionId);
        }
        return sessionId;
    },

    /**
     * Get backend cart totals and items
     */
    getCart: async (signal?: AbortSignal): Promise<any> => {
        const sessionId = CartService.getSessionId();
        const response = await apiGet(API_ENDPOINTS.CART.BASE, {
            headers: { 'x-client-session-id': sessionId },
            signal
        });
        return response.data;
    },

    /**
     * Add single item to server cart
     */
    addItem: async (variantId: string, quantity: number, version?: number, signal?: AbortSignal): Promise<any> => {
        const sessionId = CartService.getSessionId();
        const response = await apiPost(API_ENDPOINTS.CART.BASE, { variantId, quantity, version }, {
            headers: { 'x-client-session-id': sessionId },
            signal
        });
        return response.data;
    },

    /**
     * Update item quantity
     */
    updateItem: async (variantId: string, quantity: number, version?: number, signal?: AbortSignal): Promise<any> => {
        const sessionId = CartService.getSessionId();
        const response = await apiPatch(`${API_ENDPOINTS.CART.ITEMS}/${variantId}`, { quantity, version }, {
            headers: { 'x-client-session-id': sessionId },
            signal
        });
        return response.data;
    },

    /**
     * Remove item from server cart
     */
    removeItem: async (variantId: string, version?: number, signal?: AbortSignal): Promise<any> => {
        const sessionId = CartService.getSessionId();
        const response = await apiDelete(`${API_ENDPOINTS.CART.ITEMS}/${variantId}`, {
            headers: { 'x-client-session-id': sessionId },
            params: { version },
            signal
        });
        return response.data;
    },

    /**
     * Merge guest cart into user cart
     */
    mergeCart: async (): Promise<any> => {
        const sessionId = CartService.getSessionId();
        const response = await apiPost(`${API_ENDPOINTS.CART.BASE}/merge`, {}, {
            headers: { 'x-client-session-id': sessionId }
        });
        // Clear guest session after successful merge
        localStorage.removeItem(SESSION_KEY);
        return response.data;
    }
};
