import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';
import { BasePaymentProvider } from '../base-payment.provider';
import {
    CallbackData,
    PaymentMethodEnum,
    PaymentResult,
    RefundResult,
    TransactionStatus,
} from '../../types/payment.types';

/**
 * PayPal Payment Provider
 * Implements PayPal Checkout integration
 */
@Injectable()
export class PayPalProvider extends BasePaymentProvider {
    private client: paypal.core.PayPalHttpClient;
    private readonly mode: 'sandbox' | 'production';

    constructor(private readonly configService: ConfigService) {
        super('PayPalProvider');

        const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
        const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
        this.mode = this.configService.get<'sandbox' | 'production'>(
            'PAYPAL_MODE',
            'sandbox',
        );

        if (!clientId || !clientSecret) {
            this.logger.warn(
                'PayPal configuration is incomplete. PayPal payments will not work.',
            );
            // Create dummy environment to prevent crashes
            const environment = new paypal.core.SandboxEnvironment('dummy', 'dummy');
            this.client = new paypal.core.PayPalHttpClient(environment);
            return;
        }

        // Initialize PayPal client
        const environment =
            this.mode === 'production'
                ? new paypal.core.LiveEnvironment(clientId, clientSecret)
                : new paypal.core.SandboxEnvironment(clientId, clientSecret);

        this.client = new paypal.core.PayPalHttpClient(environment);
    }

    /**
     * Create PayPal order
     * Returns approval URL for user to complete payment
     */
    protected async doCreatePayment(
        orderId: string,
        amount: number,
        metadata?: Record<string, any>,
    ): Promise<PaymentResult> {
        const currency = metadata?.currency || 'USD';
        const returnUrl = metadata?.returnUrl || 'http://localhost:5173/payment/success';
        const cancelUrl = metadata?.cancelUrl || 'http://localhost:5173/payment/cancel';

        // Create PayPal order request
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            application_context: {
                brand_name: 'Ray Paradis',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW',
                return_url: returnUrl,
                cancel_url: cancelUrl,
            },
            purchase_units: [
                {
                    reference_id: orderId,
                    description: `Payment for order ${orderId}`,
                    amount: {
                        currency_code: currency,
                        value: this.formatAmount(amount).toFixed(2),
                    },
                },
            ],
        });

        try {
            const response = await this.client.execute(request);
            const paypalOrder = response.result;

            // Find approval URL
            const approvalUrl = paypalOrder.links.find(
                (link) => link.rel === 'approve',
            )?.href;

            if (!approvalUrl) {
                throw new Error('PayPal approval URL not found');
            }

            return {
                success: true,
                transactionId: paypalOrder.id,
                paymentUrl: approvalUrl,
                message: 'PayPal order created successfully',
                metadata: {
                    paypalOrderId: paypalOrder.id,
                    status: paypalOrder.status,
                },
            };
        } catch (error) {
            this.logger.error(`PayPal order creation failed: ${error.message}`);
            throw new Error(`Failed to create PayPal order: ${error.message}`);
        }
    }

    /**
     * Capture PayPal payment
     * Called after user approves payment
     */
    async capturePayment(paypalOrderId: string): Promise<CallbackData> {
        const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
        request.requestBody({});

        try {
            const response = await this.client.execute(request);
            const capturedOrder = response.result;

            // Extract order details
            const purchaseUnit = capturedOrder.purchase_units[0];
            const orderId = purchaseUnit.reference_id;
            const amount = parseFloat(purchaseUnit.amount.value);
            const capture = purchaseUnit.payments.captures[0];

            // Determine status
            let status: TransactionStatus;
            if (capture.status === 'COMPLETED') {
                status = TransactionStatus.SUCCESS;
            } else if (capture.status === 'DECLINED' || capture.status === 'FAILED') {
                status = TransactionStatus.FAILED;
            } else {
                status = TransactionStatus.PENDING;
            }

            return {
                orderId,
                transactionId: paypalOrderId,
                amount,
                status,
                paymentMethod: PaymentMethodEnum.PAYPAL,
                gatewayResponse: {
                    captureId: capture.id,
                    captureStatus: capture.status,
                    payerId: capturedOrder.payer?.payer_id,
                    payerEmail: capturedOrder.payer?.email_address,
                },
            };
        } catch (error) {
            this.logger.error(`PayPal capture failed: ${error.message}`);
            throw new Error(`Failed to capture PayPal payment: ${error.message}`);
        }
    }

    /**
     * Verify PayPal webhook
     * For webhook events from PayPal
     */
    protected async doVerifyCallback(
        callbackData: Record<string, any>,
    ): Promise<CallbackData> {
        // For PayPal, we use the capture method instead
        // This method is for webhook verification
        const eventType = callbackData.event_type;

        if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            const resource = callbackData.resource;
            const orderId = resource.custom_id || resource.invoice_id;
            const amount = parseFloat(resource.amount.value);

            return {
                orderId,
                transactionId: resource.id,
                amount,
                status: TransactionStatus.SUCCESS,
                paymentMethod: PaymentMethodEnum.PAYPAL,
                gatewayResponse: resource,
            };
        }

        throw new Error(`Unsupported PayPal webhook event: ${eventType}`);
    }

    /**
     * Process PayPal refund
     */
    protected async doProcessRefund(
        transactionId: string,
        amount: number,
        reason?: string,
    ): Promise<RefundResult> {
        // transactionId here is the capture ID from PayPal
        const request = new paypal.payments.CapturesRefundRequest(transactionId);
        request.requestBody({
            amount: {
                value: this.formatAmount(amount).toFixed(2),
                currency_code: 'USD', // Should be dynamic based on original transaction
            },
            note_to_payer: reason || 'Refund for your order',
        });

        try {
            const response = await this.client.execute(request);
            const refund = response.result;

            return {
                success: refund.status === 'COMPLETED',
                refundTransactionId: refund.id,
                amount: parseFloat(refund.amount.value),
                message: `PayPal refund ${refund.status}`,
                metadata: {
                    refundStatus: refund.status,
                    createTime: refund.create_time,
                },
            };
        } catch (error) {
            this.logger.error(`PayPal refund failed: ${error.message}`);
            throw new Error(`Failed to process PayPal refund: ${error.message}`);
        }
    }

    getPaymentMethod(): PaymentMethodEnum {
        return PaymentMethodEnum.PAYPAL;
    }

    /**
     * Get PayPal client for advanced operations
     */
    getClient(): paypal.core.PayPalHttpClient {
        return this.client;
    }
}
