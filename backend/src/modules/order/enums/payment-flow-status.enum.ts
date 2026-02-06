/**
 * Overall status of order-payment flow
 */
export enum PaymentFlowStatus {
    PENDING_PAYMENT = 'pending_payment',
    CONFIRMED = 'confirmed',
    FAILED = 'failed',
}
