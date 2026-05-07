import { create } from 'zustand';

interface VisibilityState {
  invalidProductIds: Set<string>;
  reportInvalidProduct: (id: string) => void;
  reset: () => void;
}

export const useVisibilityStore = create<VisibilityState>((set) => ({
  invalidProductIds: new Set(),
  reportInvalidProduct: (id) => set((state) => {
    if (state.invalidProductIds.has(id)) return state;
    const next = new Set(state.invalidProductIds);
    next.add(id);
    return { invalidProductIds: next };
  }),
  reset: () => set({ invalidProductIds: new Set() }),
}));
