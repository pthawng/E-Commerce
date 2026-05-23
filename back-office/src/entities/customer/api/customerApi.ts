import api from '@/shared/api/apiInstance';
import { PaginatedResponse } from '@/entities/order/api/orderApi';

type CustomerSegment = 'VIP' | 'LOYAL' | 'ACTIVE' | 'PROSPECT' | 'NEW' | 'CHURN_RISK';
type GuestListItem = Record<string, unknown>;

interface CrmStats {
    topPatron?: {
        name?: string;
    };
    newInquiries?: number;
    averageLtv?: number;
}

export interface CustomerListItem {
    id: string;
    email: string;
    phone: string | null;
    fullName: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    ltv?: number;
    orderCount?: number;
    lastOrderAt?: string;
    segment?: CustomerSegment;
}

export interface CustomerDetail extends CustomerListItem {
    bio: string | null;
    nickName: string | null;
    orders: unknown[];
    reviews: unknown[];
    discountUsages: unknown[];
    preferences?: unknown[];
    lifeEvents?: unknown[];
}

export interface CustomerUpdatePayload {
    fullName?: string;
    phone?: string;
    email?: string;
    bio?: string;
    nickName?: string;
    isActive?: boolean;
}

export const maskPII = (value: string | null | undefined, type: 'email' | 'phone') => {
    if (!value) return '-';
    if (type === 'email') {
        const [name, domain] = value.split('@');
        if (!domain) return value;
        return `${name.slice(0, 2)}****@${domain}`;
    }
    if (type === 'phone') {
        return `********${value.slice(-4)}`;
    }
    return value;
};

export const customerApi = {
    getCustomers: (params?: { page?: number; limit?: number; search?: string }) =>
        api.get<PaginatedResponse<CustomerListItem>>('/admin/rbac/users', { params }).then(res => res.data),

    getGuests: (params?: { page?: number; limit?: number }) =>
        api.get<PaginatedResponse<GuestListItem>>('/admin/crm/guests', { params }).then(res => res.data),

    getCustomerDetail: async (id: string): Promise<CustomerDetail> => {
        const [userRes, ordersRes] = await Promise.all([
            api.get<CustomerDetail>(`/admin/rbac/users/${id}`),
            api.get<{ items?: unknown[] }>('/admin/orders', { params: { customerId: id, limit: 100 } }),
        ]);

        return {
            ...userRes.data,
            orders: ordersRes.data.items || [],
        };
    },

    updateCustomer: (id: string, data: CustomerUpdatePayload) =>
        api.patch<CustomerDetail>(`/admin/rbac/users/${id}`, data).then(res => res.data),

    getStats: () => api.get<CrmStats>('/admin/crm/stats').then(res => res.data),

    logPiiAccess: (customerId: string, reason: string) =>
        Promise.resolve({ customerId, reason, recordedAt: new Date().toISOString() }),
};
