import { create } from 'zustand';

interface ModalState {
  conciergeModalOpen: boolean;
  conciergeProductId: string | null;
  conciergeProductName: string | null;

  openConcierge: (productId: string, productName: string) => void;
  closeConcierge: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  conciergeModalOpen: false,
  conciergeProductId: null,
  conciergeProductName: null,

  openConcierge: (productId, productName) =>
    set({
      conciergeModalOpen: true,
      conciergeProductId: productId,
      conciergeProductName: productName,
    }),

  closeConcierge: () =>
    set({
      conciergeModalOpen: false,
      conciergeProductId: null,
      conciergeProductName: null,
    }),
}));
