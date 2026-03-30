import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/apiClient';
import { API_ENDPOINTS } from '@shared';

/**
 * Cart Service
 * Handles data fetching and mutation with the backend.
 * Pricing and Session authority is moved to the backend.
 * Cookies (sessionId) are handled automatically by axiosClient.
 */
export const CartService = {
    /**
     * Get backend cart totals and items
     */
    getCart: async (signal?: AbortSignal): Promise<any> => {
        const response = await apiGet(API_ENDPOINTS.CART.BASE, {
            signal
        });
        return response.data;
    },

    /**
     * Add single item to server cart
     */
    addItem: async (variantId: string, quantity: number, version?: number, signal?: AbortSignal): Promise<any> => {
        const response = await apiPost(API_ENDPOINTS.CART.BASE, { variantId, quantity, version }, {
            signal
        });
        return response.data;
    },

    /**
     * Update item quantity
     */
    updateItem: async (variantId: string, quantity: number, version?: number, signal?: AbortSignal): Promise<any> => {
        const response = await apiPatch(`${API_ENDPOINTS.CART.ITEMS}/${variantId}`, { quantity, version }, {
            signal
        });
        return response.data;
    },

    /**
     * Remove item from server cart
     */
    removeItem: async (variantId: string, version?: number, signal?: AbortSignal): Promise<any> => {
        const response = await apiDelete(`${API_ENDPOINTS.CART.ITEMS}/${variantId}`, {
            params: { version },
            signal
        });
        return response.data;
    },

    /**
     * Merge guest cart into user cart
     */
    mergeCart: async (): Promise<any> => {
        const response = await apiPost(`${API_ENDPOINTS.CART.BASE}/merge`, {});
        return response.data;
    }
};
