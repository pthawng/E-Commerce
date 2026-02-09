export const queryKeys = {
    orders: {
        all: ['orders'] as const,
        list: (params: any) => ['orders', 'list', params] as const,
        detail: (id: string) => ['orders', 'detail', id] as const,
    },
    products: {
        all: ['products'] as const,
        list: (params: any) => ['products', 'list', params] as const,
        detail: (id: string) => ['products', 'detail', id] as const,
    },
    customers: {
        all: ['customers'] as const,
        list: (params: any) => ['customers', 'list', params] as const,
        detail: (id: string) => ['customers', 'detail', id] as const,
    },
    dashboard: {
        kpi: ['dashboard', 'kpi'] as const,
        revenue: (range: string) => ['dashboard', 'revenue', range] as const,
    }
};
