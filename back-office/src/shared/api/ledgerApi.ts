import api from './apiInstance';

export interface LedgerBalance {
    id: string;
    sku: string;
    name: any;
    variantTitle: any;
    quantity: number;
    reserved: number;
    available: number;
    warehouse: string;
    lastUpdated: string;
    costPrice: number;
}

export interface LedgerKPIs {
    totalMaterialValue: number;
    unverifiedRevenue: number;
    activeDiscrepancies: number;
}

export interface FinancialFlow {
    id: string;
    amount: number;
    currency: string;
    status: string;
    reconciliationStatus: string;
    paymentMethod: string;
    createdAt: string;
    order?: {
        orderNumber: string;
        totalAmount: number;
        user?: {
            fullName: string;
            email: string;
        };
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
    };
}

export const ledgerApi = {
    getBalances: async (): Promise<LedgerBalance[]> => {
        const response = await api.get('/ledger/balances');
        return response.data;
    },
    getKPIs: async (): Promise<LedgerKPIs> => {
        const response = await api.get('/ledger/kpis');
        return response.data;
    },
    getFlows: async (page = 1, limit = 20): Promise<PaginatedResponse<FinancialFlow>> => {
        const response = await api.get(`/ledger/flows?page=${page}&limit=${limit}`);
        return response.data;
    },
    reconcile: async (id: string, status: string): Promise<FinancialFlow> => {
        const response = await api.post(`/ledger/reconcile/${id}`, { status });
        return response.data;
    },
    runAudit: async (): Promise<any> => {
        const response = await api.post('/ledger/audit');
        return response.data;
    },
};
