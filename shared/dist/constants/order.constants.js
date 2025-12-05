"use strict";
/**
 * Order Constants
 * Constants cho Order - labels, configs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_STATUS_COLORS = exports.ORDER_STATUS_COLORS = exports.PAYMENT_STATUS_LABELS = exports.ORDER_STATUS_LABELS = void 0;
const enums_1 = require("../enums");
/**
 * Order Status Labels (Vietnamese)
 */
exports.ORDER_STATUS_LABELS = {
    [enums_1.OrderStatus.PENDING]: 'Chờ xử lý',
    [enums_1.OrderStatus.CONFIRMED]: 'Đã xác nhận',
    [enums_1.OrderStatus.PROCESSING]: 'Đang xử lý',
    [enums_1.OrderStatus.SHIPPING]: 'Đang giao hàng',
    [enums_1.OrderStatus.DELIVERED]: 'Đã giao hàng',
    [enums_1.OrderStatus.COMPLETED]: 'Hoàn thành',
    [enums_1.OrderStatus.CANCELLED]: 'Đã hủy',
    [enums_1.OrderStatus.RETURNED]: 'Đã trả hàng',
    [enums_1.OrderStatus.REFUNDED]: 'Đã hoàn tiền',
};
/**
 * Payment Status Labels (Vietnamese)
 */
exports.PAYMENT_STATUS_LABELS = {
    [enums_1.PaymentStatus.UNPAID]: 'Chưa thanh toán',
    [enums_1.PaymentStatus.PARTIALLY_PAID]: 'Thanh toán một phần',
    [enums_1.PaymentStatus.PAID]: 'Đã thanh toán',
    [enums_1.PaymentStatus.REFUNDED]: 'Đã hoàn tiền',
};
/**
 * Order Status Colors (for UI)
 */
exports.ORDER_STATUS_COLORS = {
    [enums_1.OrderStatus.PENDING]: 'yellow',
    [enums_1.OrderStatus.CONFIRMED]: 'blue',
    [enums_1.OrderStatus.PROCESSING]: 'purple',
    [enums_1.OrderStatus.SHIPPING]: 'indigo',
    [enums_1.OrderStatus.DELIVERED]: 'green',
    [enums_1.OrderStatus.COMPLETED]: 'green',
    [enums_1.OrderStatus.CANCELLED]: 'red',
    [enums_1.OrderStatus.RETURNED]: 'orange',
    [enums_1.OrderStatus.REFUNDED]: 'gray',
};
/**
 * Payment Status Colors (for UI)
 */
exports.PAYMENT_STATUS_COLORS = {
    [enums_1.PaymentStatus.UNPAID]: 'red',
    [enums_1.PaymentStatus.PARTIALLY_PAID]: 'yellow',
    [enums_1.PaymentStatus.PAID]: 'green',
    [enums_1.PaymentStatus.REFUNDED]: 'gray',
};
