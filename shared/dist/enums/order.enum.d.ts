/**
 * Order Status Enum
 * Trạng thái đơn hàng
 */
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    SHIPPING = "shipping",
    DELIVERED = "delivered",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    RETURNED = "returned",
    REFUNDED = "refunded"
}
/**
 * Payment Status Enum
 * Trạng thái thanh toán
 */
export declare enum PaymentStatus {
    UNPAID = "unpaid",
    PARTIALLY_PAID = "partially_paid",
    PAID = "paid",
    REFUNDED = "refunded"
}
/**
 * Transaction Type Enum
 * Loại giao dịch thanh toán
 */
export declare enum TransactionType {
    PAYMENT = "payment",
    REFUND = "refund"
}
/**
 * Transaction Status Enum
 * Trạng thái giao dịch
 */
export declare enum TransactionStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REVERSED = "reversed"
}
//# sourceMappingURL=order.enum.d.ts.map