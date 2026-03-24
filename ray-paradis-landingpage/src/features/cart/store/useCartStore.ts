import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, CartStatus, CartTotals } from '../types';
import { calculateTotals } from '../utils/pricing';

interface CartState {
    items: CartItem[];
    status: CartStatus;
    isOpen: boolean;
    error: string | null;
    
    // Actions
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    setOpen: (open: boolean) => void;
    
    // Derived
    getTotals: () => CartTotals;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            status: 'idle',
            isOpen: false,
            error: null,

            addItem: (item) => {
                const { items } = get();
                const existingItem = items.find(i => i.id === item.id);

                if (existingItem) {
                    set({
                        items: items.map(i => 
                            i.id === item.id 
                            ? { ...i, quantity: i.quantity + item.quantity } 
                            : i
                        ),
                        isOpen: true // Auto-open on add
                    });
                } else {
                    set({ 
                        items: [...items, item],
                        isOpen: true 
                    });
                }
                // Todo: Trigger Backend Sync if logged in
            },

            removeItem: (id) => {
                const { items } = get();
                set({ items: items.filter(i => i.id !== id) });
                // Todo: Trigger Backend Sync if logged in
            },

            updateQuantity: (id, quantity) => {
                const { items } = get();
                if (quantity <= 0) {
                    get().removeItem(id);
                    return;
                }
                set({
                    items: items.map(i => i.id === id ? { ...i, quantity } : i)
                });
                // Todo: Trigger Backend Sync if logged in
            },

            clearCart: () => set({ items: [] }),

            setOpen: (isOpen) => set({ isOpen }),

            getTotals: () => calculateTotals(get().items)
        }),
        {
            name: 'ray-paradis-cart',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ items: state.items }), // Only persist items
        }
    )
);
