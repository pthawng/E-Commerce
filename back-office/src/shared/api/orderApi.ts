import api from './apiInstance';
import { OrderStatusEnum } from '../types/order.types';

export interface OrderListItem {
    id: string;
    code: string;
    totalAmount: number;
    status: OrderStatusEnum;
    paymentStatus: string;
    createdAt: string;
    user?: {
        fullName: string;
        email: string;
    };
    guestEmail?: string;
    guestFullName?: string;
    _count?: {
        items: number;
    };
}

export interface OrderDetails extends OrderListItem {
    shippingAddress: any;
    stateMetadata: any;
    items: Array<{
        id: string;
        productName: string;
        variantName: string;
        quantity: number;
        price: number;
        totalLine: number;
    }>;
    timelines: Array<{
        id: string;
        action: string;
        fromStatus: string;
        toStatus: string;
        description: string;
        createdAt: string;
        actorType: string;
    }>;
}

export interface PaginatedResponse<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
    };
}

export const orderApi = {
    getOrders: (params?: any) =>
        api.get<PaginatedResponse<OrderListItem>>('/admin/orders', { params }).then(res => res.data),

    getOrder: (id: string) =>
        api.get<OrderDetails>(`/admin/orders/${id}`).then(res => res.data),

    transitionStatus: (id: string, nextStatus: OrderStatusEnum, notes?: string) =>
        api.patch(`/admin/orders/${id}/status`, { nextStatus, notes }),
};
