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
    
    // Actions
    fetchCart: () => Promise<void>;
    addItem: (variantId: string, quantity: number, details: Partial<CartItem>) => Promise<void>;
    removeItem: (variantId: string) => Promise<void>;
    updateQuantity: (variantId: string, quantity: number) => Promise<void>;
    clearCart: () => void;
    setOpen: (open: boolean) => void;
    mergeOnLogin: () => Promise<void>;
    
    // Internal Sync
    _syncWithBackend: (action: () => Promise<any>) => Promise<void>;
}

// Request Queue implementation to prevent race conditions
let pendingRequest: Promise<any> | null = null;

const DEFAULT_TOTALS: CartTotals = {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    isFreeShipping: false,
    shippingThreshold: 10000,
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

            fetchCart: async () => {
                set({ status: 'syncing' });
                try {
                    const data = await CartService.getCart();
                    set({ 
                        items: data.items, 
                        totals: data.totals,
                        status: 'idle' 
                    });
                } catch (err: any) {
                    set({ status: 'error', error: err.message });
                }
            },

            _syncWithBackend: async (action) => {
                if (pendingRequest) {
                    await pendingRequest;
                }
                
                pendingRequest = action();
                set({ status: 'syncing' });
                
                try {
                    const data = await pendingRequest;
                    if (!data) throw new Error('No data received from server');
                    
                    set({ 
                        items: data.items || [], 
                        totals: data.totals || DEFAULT_TOTALS,
                        status: 'success' 
                    });
                    setTimeout(() => set({ status: 'idle' }), 1000);
                } catch (err: any) {
                    set({ status: 'error', error: err.message });
                    console.error("Cart Sync Failed:", err);
                    // Senior Note: Removing recursive fetchCart call in error handler to prevent loops
                } finally {
                    pendingRequest = null;
                }
            },

            _recalculateTotals: (items: CartItem[]) => {
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

                set({
                    items: newItems,
                    totals: (get() as any)._recalculateTotals(newItems),
                    isOpen: true,
                    recentlyAddedId: variantId
                });

                await get()._syncWithBackend(() => CartService.addItem(variantId, quantity));
                setTimeout(() => set({ recentlyAddedId: null }), 3000);
            },

            removeItem: async (variantId) => {
                const newItems = get().items.filter(i => i.variantId !== variantId);
                set({ 
                    items: newItems,
                    totals: (get() as any)._recalculateTotals(newItems)
                });
                await get()._syncWithBackend(() => CartService.removeItem(variantId));
            },

            updateQuantity: async (variantId, quantity) => {
                if (quantity <= 0) {
                    await get().removeItem(variantId);
                    return;
                }

                const newItems = get().items.map(i => i.variantId === variantId ? { ...i, quantity } : i);
                set({
                    items: newItems,
                    totals: (get() as any)._recalculateTotals(newItems)
                });

                await get()._syncWithBackend(() => CartService.updateItem(variantId, quantity));
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
            partialize: (state) => ({ items: state.items, totals: state.totals }),
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
