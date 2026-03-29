import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, CartStatus, CartTotals } from '../types';
import { CartService } from '../services/CartService';
import { toast } from 'sonner';

interface CartState {
    items: CartItem[];
    totals: CartTotals;
    status: CartStatus;
    isOpen: boolean;
    error: string | null;
    recentlyAddedId: string | null;
    version: number;
    
    // Actions
    fetchCart: () => Promise<void>;
    addItem: (variantId: string, quantity: number, details: Partial<CartItem>) => Promise<void>;
    removeItem: (variantId: string) => Promise<void>;
    updateQuantity: (variantId: string, quantity: number) => Promise<void>;
    clearCart: () => void;
    setOpen: (open: boolean) => void;
    mergeOnLogin: () => Promise<void>;
    
    // Internal Sync
    _syncWithBackend: (action: (version: number, signal: AbortSignal) => Promise<any>) => Promise<void>;
}

// Module-level state for cancellation and debouncing
let activeAbortController: AbortController | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_TOTALS: CartTotals = {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    isFreeShipping: false,
    shippingThreshold: 2000000,
};

// Pricing/Totals Utility
const calculateTotals = (items: CartItem[]): CartTotals => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const SHIPPING_THRESHOLD = 2000000;
    const SHIPPING_FEE = 35000;
    const isFreeShipping = subtotal >= SHIPPING_THRESHOLD;
    const shipping = subtotal === 0 ? 0 : (isFreeShipping ? 0 : SHIPPING_FEE);
    const total = subtotal + shipping;
    
    return {
        subtotal,
        shipping,
        tax: 0,
        total,
        isFreeShipping,
        shippingThreshold: SHIPPING_THRESHOLD,
    };
};

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            totals: DEFAULT_TOTALS,
            status: 'idle',
            isOpen: false,
            error: null,
            recentlyAddedId: null,
            version: 1,

            fetchCart: async () => {
                set({ status: 'syncing' });
                try {
                    const data = await CartService.getCart();
                    set({ 
                        items: data.items, 
                        totals: data.totals,
                        version: data.version || 1,
                        status: 'idle' 
                    });
                } catch (err: any) {
                    set({ status: 'error', error: err.message });
                    toast.error('Could not load your cart. Please try again.');
                }
            },

            _syncWithBackend: async (action) => {
                // 1. Cancel previous in-flight request
                if (activeAbortController) {
                    activeAbortController.abort();
                }
                
                // 2. Clear previous debouncing
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                }

                activeAbortController = new AbortController();
                const signal = activeAbortController.signal;
                
                set({ status: 'syncing' });
                
                try {
                    const data = await action(get().version, signal);
                    if (!data) return; // Likely aborted or empty response
                    
                    set({ 
                        items: data.items || [], 
                        totals: data.totals || DEFAULT_TOTALS,
                        version: data.version || get().version,
                        status: 'success',
                        error: null
                    });
                    setTimeout(() => set({ status: 'idle' }), 1000);
                } catch (err: any) {
                    if (err.name === 'AbortError') return;

                    // 409 Conflict Handling (Versioning)
                    if (err.response?.status === 409 || err.code === 'CART_VERSION_MISMATCH') {
                        // Silent reconcile: just fetch the latest state and try to recover
                        await get().fetchCart();
                        return;
                    }

                    set({ status: 'error', error: err.message });
                    toast.error('Failed to update cart. Please try again.');
                    console.error("Cart Sync Failed:", err);
                } finally {
                    if (activeAbortController?.signal === signal) {
                        activeAbortController = null;
                    }
                }
            },


            addItem: async (variantId, quantity, details) => {
                const existingItems = get().items;
                let newItems: CartItem[] = [];
                const existingItem = existingItems.find(i => i.variantId === variantId);
                
                if (existingItem) {
                    newItems = existingItems.map(i => 
                        i.variantId === variantId 
                        ? { ...i, quantity: i.quantity + quantity } 
                        : i
                    );
                } else {
                    const newItem: CartItem = {
                        id: `temp-${Date.now()}`,
                        variantId,
                        productId: details.productId || '',
                        name: details.name || { en: 'Loading...' },
                        price: details.price || 0,
                        quantity,
                        image: details.image || '',
                        slug: details.slug || '',
                        attributes: details.attributes || [],
                        stock: details.stock || 99
                    };
                    newItems = [...existingItems, newItem];
                }

                // Optimistic Update
                set({
                    items: newItems,
                    totals: calculateTotals(newItems),
                    isOpen: true,
                    recentlyAddedId: variantId
                });

                await get()._syncWithBackend((v, signal) => CartService.addItem(variantId, quantity, v, signal));
                setTimeout(() => set({ recentlyAddedId: null }), 3000);
            },

            removeItem: async (variantId) => {
                const newItems = get().items.filter(i => i.variantId !== variantId);
                set({ 
                    items: newItems,
                    totals: calculateTotals(newItems)
                });
                await get()._syncWithBackend((v, signal) => CartService.removeItem(variantId, v, signal));
            },

            updateQuantity: async (variantId, quantity) => {
                if (quantity <= 0) {
                    await get().removeItem(variantId);
                    return;
                }

                // 1. Optimistic UI update
                const newItems = get().items.map(i => i.variantId === variantId ? { ...i, quantity } : i);
                set({
                    items: newItems,
                    totals: calculateTotals(newItems)
                });

                // 2. Debounced API Sync (Last-Write-Wins)
                debounceTimer = setTimeout(() => {
                    // Send version as optional: if it fails with 409, fetchCart() will fix it silenty
                    get()._syncWithBackend((v, signal) => CartService.updateItem(variantId, quantity, v, signal));
                }, 300);
            },

            mergeOnLogin: async () => {
                await get()._syncWithBackend(() => CartService.mergeCart());
            },

            clearCart: () => set({ items: [], totals: DEFAULT_TOTALS }),

            setOpen: (isOpen) => set({ isOpen }),

        }),
        {
            name: 'ray-paradis-cart',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ items: state.items, totals: state.totals, version: state.version }),
        }
    )
);

// Listen for tab synchronization
/*
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === 'ray-paradis-cart') {
            useCartStore.persist.rehydrate();
        }
    });
}
*/
