import create from 'zustand';

type State = {
  cartCount: number;
  addToCart: () => void;
};

export const useStore = create<State>((set) => ({
  cartCount: 0,
  addToCart: () => set((s) => ({ cartCount: s.cartCount + 1 })),
}));
