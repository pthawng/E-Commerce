import api from './apiInstance';
import { PaginatedResponse } from './orderApi';

// ============================================
// CUSTOMER TYPES (CRM)
// ============================================

export interface CustomerListItem {
    id: string;
    email: string;
    phone: string | null;
    fullName: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    // Calculated fields (Frontend or Intelligence Layer)
    ltv?: number;
    orderCount?: number;
    lastOrderAt?: string;
    segment?: 'VIP' | 'LOYAL' | 'ACTIVE' | 'PROSPECT' | 'NEW' | 'CHURN_RISK';
}

export interface CustomerDetail extends CustomerListItem {
    bio: string | null;
    nickName: string | null;
    orders: any[]; // Linked to OrderListItem
    reviews: any[]; // Linked to ReviewItem
    discountUsages: any[];
    preferences?: any[];
    lifeEvents?: any[];
}

export interface CustomerUpdatePayload {
    fullName?: string;
    phone?: string;
    email?: string;
    bio?: string;
    nickName?: string;
    isActive?: boolean;
}

// ============================================
// FAANG-GRADE PRIVACY UTILS
// ============================================

export const maskPII = (value: string | null | undefined, type: 'email' | 'phone') => {
    if (!value) return '—';
    if (type === 'email') {
        const [name, domain] = value.split('@');
        if (!domain) return value;
        return `${name.slice(0, 2)}••••@${domain}`;
    }
    if (type === 'phone') {
        return `••••••••${value.slice(-4)}`;
    }
    return value;
};

// ============================================
// CRM API METHODS
// ============================================

export const customerApi = {
    // We use the admin/rbac/users endpoint but wrap it for CRM purposes
    getCustomers: (params?: { page?: number; limit?: number; search?: string }) =>
        api.get<PaginatedResponse<CustomerListItem>>('/admin/rbac/users', { params }).then(res => res.data),

    getGuests: (params?: { page?: number; limit?: number }) =>
        api.get<PaginatedResponse<any>>('/admin/crm/guests', { params }).then(res => res.data),

    // In a real FAANG system, we'd have a /crm/customers/:id with aggregated data
    // Here we might need multiple calls or a targeted include if supported
    getCustomerDetail: async (id: string): Promise<CustomerDetail> => {
        const [userRes, ordersRes] = await Promise.all([
            api.get(`/admin/rbac/users/${id}`),
            api.get('/admin/orders', { params: { customerId: id, limit: 100 } })
        ]);

        // Enriching user with history
        return {
            ...userRes.data,
            orders: ordersRes.data.items || [],
        };
    },

    updateCustomer: (id: string, data: CustomerUpdatePayload) =>
        api.patch<CustomerDetail>(`/admin/rbac/users/${id}`, data).then(res => res.data),

    getStats: () =>
        api.get<any>('/admin/crm/stats').then(res => res.data),

    // Audit Logging Simulator (Frontend part of FAANG-grade requirement)
    logPiiAccess: (customerId: string, reason: string) => {
        console.log(`[AUDIT] PII Access logged for ${customerId}: ${reason}`);
        // return api.post('/admin/audit/pii-access', { customerId, reason });
    }
};
