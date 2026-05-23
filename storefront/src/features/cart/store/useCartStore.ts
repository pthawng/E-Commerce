import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, CartStatus, CartTotals, Cart } from '../types';
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
    isHydrated: boolean;
    config: {
        shippingThreshold: number;
        shippingFee: number;
        currency: string;
        maxQuantityPerItem: number;
    } | null;

    // Actions
    fetchCart: () => Promise<void>;
    addItem: (variantId: string, quantity: number, details: Partial<CartItem>) => Promise<void>;
    removeItem: (variantId: string) => Promise<void>;
    updateQuantity: (variantId: string, quantity: number) => Promise<void>;
    clearCart: () => void;
    setOpen: (open: boolean) => void;
    mergeOnLogin: () => Promise<void>;

    // Internal Sync
    _syncWithBackend: (
        action: (version: number, signal: AbortSignal) => Promise<Cart>,
        versionOverride?: number,
        rollbackItems?: CartItem[],
    ) => Promise<void>;
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

const DEFAULT_CONFIG = {
    shippingThreshold: 2000000,
    shippingFee: 35000,
    currency: 'VND',
    maxQuantityPerItem: 99,
};

// Pricing/Totals Utility (Centralized Logic - FE fallback)
const calculateTotals = (items: CartItem[], config = DEFAULT_CONFIG): CartTotals => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const SHIPPING_THRESHOLD = config.shippingThreshold;
    const SHIPPING_FEE = config.shippingFee;
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
            isHydrated: false,
            config: null,

            fetchCart: async () => {
                set({ status: 'syncing' });
                try {
                    // Fetch config in background if not hydrated
                    if (!get().isHydrated || !get().config) {
                        CartService.getConfig().then(cfg => set({ config: cfg })).catch(() => { });
                    }

                    const data = await CartService.getCart();
                    set({
                        items: data.items,
                        totals: data.totals,
                        version: data.version || 1,
                        isHydrated: true,
                        status: 'idle'
                    });
                } catch (err) {
                    const message = err instanceof Error ? err.message : 'Could not load your cart';
                    set({ status: 'error', error: message, isHydrated: true });
                    toast.error('Could not load your cart. Please try again.');
                }
            },

            _syncWithBackend: async (action, versionOverride, rollbackItems) => {
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

                // UX: do not clear totals/items; CartDrawer overlays on "syncing"
                set({ status: 'syncing' });

                try {
                    const versionSnapshot = versionOverride ?? get().version;
                    const data = await action(versionSnapshot, signal);
                    if (!data) return;

                    set({
                        items: data.items || [],
                        totals: data.totals || DEFAULT_TOTALS,
                        version: data.version || get().version,
                        status: 'success',
                        error: null
                    });
                    setTimeout(() => set({ status: 'idle' }), 1000);
                } catch (err) {
                    const errorObj = err as { name?: string; response?: { status: number }; code?: string; message?: string };
                    if (errorObj.name === 'AbortError') return;

                    // 409 Conflict Handling
                    if (errorObj.response?.status === 409 || errorObj.code === 'CART_VERSION_MISMATCH') {
                        await get().fetchCart();
                        return;
                    }

                    set({ status: 'error', error: errorObj.message || 'Unknown error occurred' });
                    if (rollbackItems) {
                        set({ items: rollbackItems, totals: calculateTotals(rollbackItems, get().config || DEFAULT_CONFIG) });
                    }
                    toast.error('Failed to update cart. Please try again.');
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

                // UX: Keep old totals but show sync status
                set({
                    items: newItems,
                    status: 'syncing',
                    isOpen: true,
                    recentlyAddedId: variantId,
                });

                const idempotencyKey = crypto.randomUUID?.() || Math.random().toString(36).substring(7);
                const currentVersion = get().version;
                const prevItemsSnapshot = existingItems;

                await get()._syncWithBackend(
                    (v, signal) => CartService.addItem(variantId, quantity, currentVersion, signal, idempotencyKey),
                    undefined,
                    prevItemsSnapshot
                );
                setTimeout(() => set({ recentlyAddedId: null }), 3000);
            },

            removeItem: async (variantId: string) => {
                const currentVersion = get().version;
                const prevItemsSnapshot = get().items;
                const newItems = get().items.filter(i => i.variantId !== variantId);
                set({ items: newItems, status: 'syncing' });

                await get()._syncWithBackend(
                    (v, signal) => CartService.removeItem(variantId, currentVersion, signal),
                    undefined,
                    prevItemsSnapshot
                );
            },

            updateQuantity: async (variantId: string, quantity: number) => {
                const currentVersion = get().version;
                if (quantity <= 0) {
                    await get().removeItem(variantId);
                    return;
                }

                // Optimistic UI
                const prevItemsSnapshot = get().items;
                const newItems = get().items.map(i => i.variantId === variantId ? { ...i, quantity } : i);
                set({ items: newItems, status: 'syncing' });

                // Debounced API Sync
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    get()._syncWithBackend(
                        (v, signal) => CartService.updateItem(variantId, quantity, currentVersion, signal),
                        currentVersion,
                        prevItemsSnapshot
                    );
                }, 300);
            },

            clearCart: () => set({ items: [], totals: DEFAULT_TOTALS, version: 1 }),

            setOpen: (isOpen) => set({ isOpen }),

            mergeOnLogin: async () => {
                await get()._syncWithBackend(async () => {
                    const data = await CartService.mergeCart();
                    if (data.warnings?.length) {
                        data.warnings.forEach((w) => {
                            if (w.type === 'OUT_OF_STOCK') {
                                toast.warning('Some items are out of stock and were removed.');
                            } else if (w.type === 'QUANTITY_REDUCED') {
                                toast.warning('Quantity for some items was adjusted based on stock.');
                            }
                        });
                    }
                    return data;
                });
            },
        }),
        {
            name: 'ray-paradis-cart',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                items: state.items,
                totals: state.totals,
                version: state.version,
                config: state.config
            }),
        }
    )
);

// Tab Synchronization
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === 'ray-paradis-cart') {
            useCartStore.persist.rehydrate();
        }
    });
}
