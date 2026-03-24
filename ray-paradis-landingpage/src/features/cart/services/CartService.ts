import { CartItem } from '../types';

/**
 * Cart Service
 * Handles synchronization between local store and backend.
 */
export const CartService = {
    /**
     * Sync local cart to server (Merge strategy)
     */
    syncCart: async (items: CartItem[]): Promise<CartItem[]> => {
        // Mock API call
        return new Promise((resolve) => {
            setTimeout(() => resolve(items), 800);
        });
        
        /* TODO: Real API
        const response = await apiClient.post('/cart/sync', { items });
        return response.data;
        */
    },

    /**
     * Add single item to server cart
     */
    addItem: async (item: CartItem): Promise<void> => {
        // Mock API call
        return new Promise((resolve) => setTimeout(resolve, 500));
    },

    /**
     * Remove item from server cart
     */
    removeItem: async (itemId: string): Promise<void> => {
        // Mock API call
        return new Promise((resolve) => setTimeout(resolve, 500));
    }
};
