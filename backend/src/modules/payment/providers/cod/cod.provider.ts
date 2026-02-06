import { Injectable } from '@nestjs/common';
import { BasePaymentProvider } from '../base-payment.provider';
import {
    CallbackData,
    PaymentMethodEnum,
    PaymentResult,
    RefundResult,
    TransactionStatus,
} from '../../types/payment.types';

/**
 * COD (Cash on Delivery) Payment Provider
 * Simple provider for cash payments
 */
@Injectable()
export class CODProvider extends BasePaymentProvider {
    constructor() {
        super('CODProvider');
    }

    /**
     * Create COD payment
     * No external API calls needed
     */
    protected async doCreatePayment(
        orderId: string,
        amount: number,
        metadata?: Record<string, any>,
    ): Promise<PaymentResult> {
        const transactionId = this.generateTransactionRef(orderId);

        return {
            success: true,
            transactionId,
            message: 'COD payment created. Payment will be collected on delivery.',
            metadata: {
                paymentMethod: 'COD',
                amount,
                note: 'Customer will pay cash on delivery',
            },
        };
    }

    /**
     * Verify COD callback
     * For manual confirmation by staff
     */
    protected async doVerifyCallback(
        callbackData: Record<string, any>,
    ): Promise<CallbackData> {
        const { orderId, transactionId, amount, confirmed } = callbackData;

        return {
            orderId,
            transactionId,
            amount,
            status: confirmed
                ? TransactionStatus.SUCCESS
                : TransactionStatus.PENDING,
            paymentMethod: PaymentMethodEnum.COD,
            gatewayResponse: {
                confirmedBy: callbackData.confirmedBy,
                confirmedAt: callbackData.confirmedAt,
                note: callbackData.note,
            },
        };
    }

    /**
     * Process COD refund
     * No external API needed, just record the refund
     */
    protected async doProcessRefund(
        transactionId: string,
        amount: number,
        reason?: string,
    ): Promise<RefundResult> {
        const refundTxnRef = `REFUND_${transactionId}_${Date.now()}`;

        return {
            success: true,
            refundTransactionId: refundTxnRef,
            amount,
            message: 'COD refund recorded. Cash will be returned to customer.',
            metadata: {
                originalTransactionId: transactionId,
                reason,
                note: 'Manual cash refund required',
            },
        };
    }

    getPaymentMethod(): PaymentMethodEnum {
        return PaymentMethodEnum.COD;
    }
}
