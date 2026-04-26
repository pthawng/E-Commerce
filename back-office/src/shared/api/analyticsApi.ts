import api from './apiInstance';

export enum LuxurySegment {
    PROSPECT = 'PROSPECT',
    ACTIVE = 'ACTIVE',
    LOYAL = 'LOYAL',
    VIP = 'VIP',
    VVIP = 'VVIP',
    VIC = 'VIC'
}

export interface AnalyticsMetric {
    label: string;
    value: number;
    delta: number;
    prefix?: string;
}

export interface ChartPoint {
    date: string;
    value: number;
}

export interface ExecutiveOverview {
    metrics: AnalyticsMetric[];
    revenueChart: ChartPoint[];
}

export interface CustomerIntelligence {
    segmentDistribution: { type: string; value: number }[];
    clvMatrix: { segment: string; count: number; avgClv: number }[];
}

export interface ProductPerformance {
    sku: string;
    name: string;
    volume: number;
    revenue: number;
    cost: number;
    margin: number;
}

export interface OperationsPulse {
    step: string;
    avgHours: number;
}

export const analyticsApi = {
    getOverview: async (range: string = '30d'): Promise<ExecutiveOverview> => {
        const response = await api.get(`/admin/analytics/overview?range=${range}`);
        return response.data;
    },
    getCustomerIntelligence: async (): Promise<CustomerIntelligence> => {
        const response = await api.get('/admin/analytics/customer-intelligence');
        return response.data;
    },
    getProductPerformance: async (limit: number = 20): Promise<ProductPerformance[]> => {
        const response = await api.get(`/admin/analytics/product-performance?limit=${limit}`);
        return response.data;
    },
    getOperationsPulse: async (): Promise<OperationsPulse[]> => {
        const response = await api.get('/admin/analytics/operations-pulse');
        return response.data;
    },
};
