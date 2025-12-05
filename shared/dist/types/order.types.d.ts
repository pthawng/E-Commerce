/**
 * Order Types
 * Types cho Order entity - dùng chung giữa BE và FE
 */
import { OrderStatus, PaymentStatus } from '../enums';
/**
 * Order Item
 */
export interface OrderItem {
    id: string;
    orderId: string;
    productVariantId?: string;
    productName: string;
    sku: string;
    variantTitle: any;
    thumbnailUrl?: string;
    quantity: number;
    price: number;
    totalLine: number;
}
/**
 * Order
 */
export interface Order {
    id: string;
    code: string;
    userId?: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    shippingAddress: any;
    billingAddress?: any;
    shippingMethodId?: string;
    shippingMethodName?: string;
    trackingCode?: string;
    estimatedDeliveryAt?: Date | string;
    currency: string;
    subTotal: number;
    shippingFee: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    note?: string;
    cancelReason?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    confirmedAt?: Date | string;
    shippedAt?: Date | string;
    deliveredAt?: Date | string;
    completedAt?: Date | string;
    cancelledAt?: Date | string;
    items?: OrderItem[];
}
/**
 * Order Summary (cho list)
 */
export interface OrderSummary {
    id: string;
    code: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    itemCount: number;
    createdAt: Date | string;
    customerName?: string;
}
//# sourceMappingURL=order.types.d.ts.map