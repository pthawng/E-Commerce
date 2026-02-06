/**
 * VNPAY API Endpoints
 */
export const VNPAY_ENDPOINTS = {
    PAYMENT: '/paymentv2/vpcpay.html',
    QUERY: '/merchant_webapi/api/transaction',
    REFUND: '/merchant_webapi/api/transaction',
};

/**
 * VNPAY Response Codes
 * Reference: https://sandbox.vnpayment.vn/apis/docs/bang-ma-loi/
 */
export const VNPAY_RESPONSE_CODE = {
    SUCCESS: '00',
    TRANSACTION_NOT_FOUND: '01',
    ORDER_ALREADY_CONFIRMED: '02',
    INVALID_AMOUNT: '04',
    INVALID_SIGNATURE: '97',
    SYSTEM_ERROR: '99',
} as const;

/**
 * VNPAY Command Codes
 */
export const VNPAY_COMMAND = {
    PAY: 'pay',
    QUERY_DR: 'querydr',
    REFUND: 'refund',
} as const;

/**
 * VNPAY Transaction Types
 */
export const VNPAY_TRANSACTION_TYPE = {
    FULL_REFUND: '02', // Hoàn trả toàn phần
    PARTIAL_REFUND: '03', // Hoàn trả một phần
} as const;

/**
 * VNPAY Order Types
 */
export const VNPAY_ORDER_TYPE = {
    TOPUP: 'topup',
    BILL_PAYMENT: 'billpayment',
    OTHER: 'other',
} as const;

/**
 * VNPAY Currency Code
 */
export const VNPAY_CURRENCY_CODE = 'VND';

/**
 * VNPAY Version
 */
export const VNPAY_VERSION = '2.1.0';

/**
 * VNPAY Locale
 */
export const VNPAY_LOCALE = {
    VN: 'vn',
    EN: 'en',
} as const;
