import type { PaginationMeta } from '@/features/product/types';

export const OrderStatus = {
    PENDING_PAYMENT: 'pending_payment',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    RETURNED: 'returned',
    REFUNDED: 'refunded',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const PaymentStatus = {
    UNPAID: 'unpaid',
    PARTIALLY_PAID: 'partially_paid',
    PAID: 'paid',
    REFUNDED: 'refunded',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentMethod = {
    COD: 'COD',
    VNPAY: 'VNPAY',
    PAYPAL: 'PAYPAL',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface OrderItem {
    id: string;
    orderId: string;
    productVariantId: string | null;
    productName: string;
    sku: string;
    variantTitle: Record<string, any>;
    thumbnailUrl: string | null;
    quantity: number;
    price: number;
    totalLine: number;
}

export interface OrderTimeline {
    id: string;
    orderId: string;
    action: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus | null;
    description: string | null;
    actorId: string | null;
    actorType: 'system' | 'admin' | 'user';
    metadata: Record<string, any> | null;
    createdAt: string;
}

export interface PaymentTransaction {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    type: 'payment' | 'refund';
    status: 'pending' | 'success' | 'failed' | 'reversed';
    provider: string;
    method: string | null;
    transactionCode: string | null;
    gatewayResponse: Record<string, any> | null;
    createdAt: string;
}

export interface Order {
    id: string;
    code: string;
    userId: string | null;
    user?: {
        id: string;
        email: string;
        fullName: string | null;
    };
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod | null;
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        city?: string;
        district?: string;
        ward?: string;
        [key: string]: any;
    };
    billingAddress: Record<string, any> | null;
    subTotal: number;
    shippingFee: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    note: string | null;
    cancelReason: string | null;
    trackingCode: string | null;
    estimatedDeliveryAt: string | null;
    createdAt: string;
    updatedAt: string;
    confirmedAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;

    items?: OrderItem[];
    timelines?: OrderTimeline[];
    transactions?: PaymentTransaction[];
    _count?: {
        items: number;
    };
}

export interface PaginatedOrders {
    items: Order[];
    meta: PaginationMeta;
}

export interface OrderFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: OrderStatus;
    sort?: string;
}
