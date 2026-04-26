export enum OrderStatusEnum {
    DRAFT = 'DRAFT',
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    CONFIRMED = 'CONFIRMED',
    MATERIAL_RESERVED = 'MATERIAL_RESERVED',
    IN_PRODUCTION = 'IN_PRODUCTION',
    QC = 'QC',
    READY_TO_SHIP = 'READY_TO_SHIP',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    RETURNED = 'RETURNED',
    REFUNDED = 'REFUNDED',
}

export const ORDER_STATUS_CONFIG: Record<OrderStatusEnum, { color: string; label: string }> = {
    [OrderStatusEnum.DRAFT]: { color: 'default', label: 'Dự thảo' },
    [OrderStatusEnum.PENDING_PAYMENT]: { color: 'warning', label: 'Chờ thanh toán' },
    [OrderStatusEnum.CONFIRMED]: { color: 'processing', label: 'Đã xác nhận' },
    [OrderStatusEnum.MATERIAL_RESERVED]: { color: 'cyan', label: 'Đã giữ nguyên liệu' },
    [OrderStatusEnum.IN_PRODUCTION]: { color: 'purple', label: 'Đang sản xuất' },
    [OrderStatusEnum.QC]: { color: 'orange', label: 'Kiểm tra chất lượng' },
    [OrderStatusEnum.READY_TO_SHIP]: { color: 'lime', label: 'Sẵn sàng giao' },
    [OrderStatusEnum.SHIPPED]: { color: 'blue', label: 'Đang giao' },
    [OrderStatusEnum.DELIVERED]: { color: 'green', label: 'Đã giao' },
    [OrderStatusEnum.COMPLETED]: { color: 'gold', label: 'Hoàn tất' },
    [OrderStatusEnum.CANCELLED]: { color: 'error', label: 'Đã hủy' },
    [OrderStatusEnum.RETURNED]: { color: 'volcano', label: 'Trả hàng' },
    [OrderStatusEnum.REFUNDED]: { color: 'magenta', label: 'Đã hoàn tiền' },
};

export const VALID_TRANSITIONS: Record<OrderStatusEnum, OrderStatusEnum[]> = {
    [OrderStatusEnum.DRAFT]: [OrderStatusEnum.PENDING_PAYMENT],
    [OrderStatusEnum.PENDING_PAYMENT]: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.CONFIRMED]: [OrderStatusEnum.MATERIAL_RESERVED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.MATERIAL_RESERVED]: [OrderStatusEnum.IN_PRODUCTION, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.IN_PRODUCTION]: [OrderStatusEnum.QC, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.QC]: [OrderStatusEnum.READY_TO_SHIP, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.READY_TO_SHIP]: [OrderStatusEnum.SHIPPED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.SHIPPED]: [OrderStatusEnum.DELIVERED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.DELIVERED]: [OrderStatusEnum.COMPLETED, OrderStatusEnum.RETURNED],
    [OrderStatusEnum.RETURNED]: [OrderStatusEnum.REFUNDED],
    [OrderStatusEnum.COMPLETED]: [OrderStatusEnum.REFUNDED],
    [OrderStatusEnum.CANCELLED]: [],
    [OrderStatusEnum.REFUNDED]: [],
};

export enum PaymentStatusEnum {
    unpaid = 'unpaid',
    partially_paid = 'partially_paid',
    paid = 'paid',
    refunded = 'refunded',
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatusEnum, { color: string; label: string }> = {
    [PaymentStatusEnum.unpaid]: { color: 'error', label: 'Chưa thanh toán' },
    [PaymentStatusEnum.partially_paid]: { color: 'warning', label: 'Thanh toán một phần' },
    [PaymentStatusEnum.paid]: { color: 'success', label: 'Đã thanh toán' },
    [PaymentStatusEnum.refunded]: { color: 'default', label: 'Đã hoàn tiền' },
};

export enum LuxurySegment {
    PROSPECT = 'PROSPECT',
    ACTIVE = 'ACTIVE',
    LOYAL = 'LOYAL',
    VIP = 'VIP',
    VVIP = 'VVIP',
    VIC = 'VIC',
}

export const LUXURY_SEGMENT_CONFIG: Record<LuxurySegment, { color: string; label: string; icon?: string }> = {
    [LuxurySegment.PROSPECT]: { color: 'default', label: 'Tiềm năng' },
    [LuxurySegment.ACTIVE]: { color: 'blue', label: 'Năng động' },
    [LuxurySegment.LOYAL]: { color: 'cyan', label: 'Thân thiết' },
    [LuxurySegment.VIP]: { color: 'gold', label: 'VIP' },
    [LuxurySegment.VVIP]: { color: 'purple', label: 'VVIP' },
    [LuxurySegment.VIC]: { color: 'red', label: 'VIC' },
};
