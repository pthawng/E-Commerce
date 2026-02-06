import type { ApiResponse } from '@shared';
import { apiGet, apiPost } from '@/services/apiClient';

// Types
export interface Order {
    id: string;
    code: string;
    userId: string | null;
    sessionId: string | null;
    status: 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentMethod: 'COD' | 'VNPAY' | 'PAYPAL';
    paymentDeadline: string | null;
    subTotal: number;
    shippingFee: number;
    totalAmount: number;
    shippingAddress: any;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        email: string;
        fullName: string | null;
    };
    orderItems: OrderItem[];
    payment?: Payment;
}

export interface OrderItem {
    id: string;
    orderId: string;
    variantId: string;
    quantity: number;
    price: number;
    variant: {
        id: string;
        name: string;
        product: {
            id: string;
            name: string;
        };
    };
}

export interface Payment {
    id: string;
    orderId: string;
    transactionId: string | null;
    paymentMethod: string;
    amount: number;
    status: string;
    createdAt: string;
}

export interface OrderStatus {
    orderId: string;
    status: string;
    paymentDeadline: string | null;
    remainingSeconds: number | null;
    canPay: boolean;
    canCancel: boolean;
}

export interface OrderListParams {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}

export interface OrderListResponse {
    data: Order[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// API Methods
export const ordersApi = {
    /**
     * Get all orders with filters
     */
    getAll: async (params?: OrderListParams): Promise<ApiResponse<OrderListResponse>> => {
        return apiGet<OrderListResponse>('/api/orders', { params });
    },

    /**
     * Get order by ID
     */
    getById: async (id: string): Promise<ApiResponse<Order>> => {
        return apiGet<Order>(`/api/orders/${id}`);
    },

    /**
     * Get order status with remaining time
     */
    getStatus: async (id: string): Promise<ApiResponse<OrderStatus>> => {
        return apiGet<OrderStatus>(`/api/orders/${id}/status`);
    },

    /**
     * Cancel order
     */
    cancel: async (id: string, reason: string): Promise<ApiResponse<Order>> => {
        return apiPost<Order>(`/api/orders/${id}/cancel`, { reason });
    },
};
