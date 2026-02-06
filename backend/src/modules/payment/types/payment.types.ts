/**
 * Payment Method Enum
 * Defines supported payment methods
 */
export enum PaymentMethodEnum {
    COD = 'COD',
    VNPAY = 'VNPAY',
    PAYPAL = 'PAYPAL',
}

/**
 * Transaction Status Enum
 * Matches Prisma schema TransactionStatusEnum
 */
export enum TransactionStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    REVERSED = 'reversed',
}

/**
 * Payment Result
 * Returned after creating a payment
 */
export interface PaymentResult {
    success: boolean;
    transactionId: string;
    paymentUrl?: string; // For redirect-based payments (VNPAY, PayPal)
    message?: string;
    metadata?: Record<string, any>;
}

/**
 * Refund Result
 * Returned after processing a refund
 */
export interface RefundResult {
    success: boolean;
    refundTransactionId: string;
    amount: number;
    message?: string;
    metadata?: Record<string, any>;
}

/**
 * Callback Data
 * Generic structure for payment gateway callbacks
 */
export interface CallbackData {
    orderId: string;
    transactionId: string;
    amount: number;
    status: TransactionStatus;
    paymentMethod: PaymentMethodEnum;
    gatewayResponse: Record<string, any>;
    signature?: string;
}

/**
 * Payment Provider Interface
 * All payment providers must implement this interface
 */
export interface IPaymentProvider {
    /**
     * Create a payment transaction
     * @param orderId - Order ID
     * @param amount - Payment amount
     * @param metadata - Additional metadata (return URL, order info, etc.)
     * @returns PaymentResult with payment URL or confirmation
     */
    createPayment(
        orderId: string,
        amount: number,
        metadata?: Record<string, any>,
    ): Promise<PaymentResult>;

    /**
     * Verify and process payment callback from gateway
     * @param callbackData - Raw callback data from payment gateway
     * @returns Processed CallbackData
     */
    verifyCallback(callbackData: Record<string, any>): Promise<CallbackData>;

    /**
     * Process a refund
     * @param transactionId - Original transaction ID
     * @param amount - Refund amount
     * @param reason - Refund reason
     * @returns RefundResult
     */
    processRefund(
        transactionId: string,
        amount: number,
        reason?: string,
    ): Promise<RefundResult>;

    /**
     * Get payment method identifier
     */
    getPaymentMethod(): PaymentMethodEnum;
}

/**
 * Payment Configuration
 */
export interface PaymentConfig {
    vnpay?: {
        tmnCode: string;
        hashSecret: string;
        url: string;
        returnUrl: string;
        apiUrl: string;
    };
    paypal?: {
        clientId: string;
        clientSecret: string;
        mode: 'sandbox' | 'production';
        webhookId?: string;
    };
    currency: string;
    locale: string;
}
