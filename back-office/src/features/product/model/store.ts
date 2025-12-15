import { create } from 'zustand';
import type { PaginationQuery } from './types';

interface ProductState {
    filters: PaginationQuery;
    setFilters: (filters: Partial<PaginationQuery>) => void;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    resetFilters: () => void;
}

const initialFilters: PaginationQuery = {
    page: 1,
    limit: 12,
    search: undefined,
    sort: undefined,
    order: undefined,
};

export const useProductStore = create<ProductState>((set) => ({
    filters: initialFilters,
    setFilters: (newFilters) =>
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
    setSearch: (search) =>
        set((state) => ({
            filters: { ...state.filters, search: search || undefined, page: 1 },
        })),
    setPage: (page) =>
        set((state) => ({ filters: { ...state.filters, page } })),
    resetFilters: () => set({ filters: initialFilters }),
}));
