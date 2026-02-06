import { Logger } from '@nestjs/common';
import {
    CallbackData,
    IPaymentProvider,
    PaymentMethodEnum,
    PaymentResult,
    RefundResult,
} from '../types/payment.types';

/**
 * Base Payment Provider
 * Abstract class providing common functionality for all payment providers
 * Uses Template Method pattern
 */
export abstract class BasePaymentProvider implements IPaymentProvider {
    protected readonly logger: Logger;

    constructor(loggerContext: string) {
        this.logger = new Logger(loggerContext);
    }

    /**
     * Template method for creating payment
     * Handles logging and error handling
     */
    async createPayment(
        orderId: string,
        amount: number,
        metadata?: Record<string, any>,
    ): Promise<PaymentResult> {
        this.logger.log(
            `Creating payment for order ${orderId}, amount: ${amount}, method: ${this.getPaymentMethod()}`,
        );

        try {
            const result = await this.doCreatePayment(orderId, amount, metadata);
            this.logger.log(
                `Payment created successfully for order ${orderId}, transaction: ${result.transactionId}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to create payment for order ${orderId}: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Template method for verifying callback
     */
    async verifyCallback(
        callbackData: Record<string, any>,
    ): Promise<CallbackData> {
        this.logger.log(`Processing callback for ${this.getPaymentMethod()}`);

        try {
            const result = await this.doVerifyCallback(callbackData);
            this.logger.log(
                `Callback verified successfully for order ${result.orderId}, status: ${result.status}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to verify callback: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Template method for processing refund
     */
    async processRefund(
        transactionId: string,
        amount: number,
        reason?: string,
    ): Promise<RefundResult> {
        this.logger.log(
            `Processing refund for transaction ${transactionId}, amount: ${amount}`,
        );

        try {
            const result = await this.doProcessRefund(transactionId, amount, reason);
            this.logger.log(
                `Refund processed successfully: ${result.refundTransactionId}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to process refund for transaction ${transactionId}: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Abstract methods to be implemented by concrete providers
     */
    protected abstract doCreatePayment(
        orderId: string,
        amount: number,
        metadata?: Record<string, any>,
    ): Promise<PaymentResult>;

    protected abstract doVerifyCallback(
        callbackData: Record<string, any>,
    ): Promise<CallbackData>;

    protected abstract doProcessRefund(
        transactionId: string,
        amount: number,
        reason?: string,
    ): Promise<RefundResult>;

    abstract getPaymentMethod(): PaymentMethodEnum;

    /**
     * Utility method for formatting amount
     * Different gateways may require different formats
     */
    protected formatAmount(amount: number): number {
        return Math.round(amount);
    }

    /**
     * Utility method for generating transaction reference
     */
    protected generateTransactionRef(orderId: string): string {
        const timestamp = Date.now();
        return `${orderId}-${timestamp}`;
    }
}
