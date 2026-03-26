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
 * VietQR Payment Provider
 * Simple provider for manual QR bank transfers
 */
@Injectable()
export class VietQRProvider extends BasePaymentProvider {
    constructor() {
        super('VietQRProvider');
    }

    /**
     * Create VietQR payment
     * No external API calls needed for now (returns manual instructions or static QR)
     */
    protected async doCreatePayment(
        orderId: string,
        amount: number,
        metadata?: Record<string, any>,
    ): Promise<PaymentResult> {
        const transactionId = this.generateTransactionRef(orderId);
        // Generate a short, unique code for the customer to put in the transfer description
        // RP + last 6 chars of orderId + random string
        const transferCode = `RP${orderId.slice(-6).toUpperCase()}`;

        return {
            success: true,
            transactionId,
            message: `VietQR payment created. Please scan the QR code and ensure the transfer description is: ${transferCode}`,
            metadata: {
                paymentMethod: 'VIETQR',
                amount,
                transferCode,
                note: `Customer must use description: ${transferCode}`,
            },
        };
    }

    /**
     * Verify VietQR callback
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
            paymentMethod: PaymentMethodEnum.VIETQR,
            gatewayResponse: {
                confirmedBy: callbackData.confirmedBy,
                confirmedAt: callbackData.confirmedAt,
                note: callbackData.note,
            },
        };
    }

    /**
     * Process VietQR refund
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
            message: 'VietQR refund recorded. Please refund via bank transfer manually.',
            metadata: {
                originalTransactionId: transactionId,
                reason,
                note: 'Manual bank refund required',
            },
        };
    }

    getPaymentMethod(): PaymentMethodEnum {
        return PaymentMethodEnum.VIETQR;
    }
}
