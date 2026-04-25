import { CurrencyService } from '@modules/system/currency.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';
import {
  CallbackData,
  PaymentMethodEnum,
  PaymentResult,
  RefundResult,
  TransactionStatus,
} from '../../types/payment.types';
import { BasePaymentProvider } from '../base-payment.provider';

/**
 * PayPal Payment Provider
 * Implements PayPal Checkout integration
 */
@Injectable()
export class PayPalProvider extends BasePaymentProvider {
  private client: paypal.core.PayPalHttpClient;
  private readonly mode: 'sandbox' | 'production';

  constructor(
    private readonly configService: ConfigService,
    private readonly currencyService: CurrencyService
  ) {
    super('PayPalProvider');

    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
    this.mode = this.configService.get<'sandbox' | 'production'>('PAYPAL_MODE', 'sandbox');

    if (!clientId || !clientSecret) {
      this.logger.warn('PayPal configuration is incomplete. PayPal payments will not work.');
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
    const currency = 'USD'; // PayPal standard for this integration
    const returnUrl = metadata?.returnUrl || 'http://localhost:8080/payment-result';
    const cancelUrl = metadata?.cancelUrl || 'http://localhost:8080/payment-result?status=failed';

    // Currency conversion: VND -> USD
    // L8: Use frozen exchange rate from metadata (preferred) or dynamic service fallback
    let rate: number;
    if (metadata?.exchangeRate) {
      rate = Number(metadata.exchangeRate);
    } else {
      // Dynamic fallback from CurrencyService if metadata is missing (defensive)
      const currentVndToUsdRate = await this.currencyService.getRate('USD');
      rate = currentVndToUsdRate;
    }

    const amountUsd = parseFloat((amount * rate).toFixed(2));

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
            value: amountUsd.toString(),
          },
        },
      ],
    });

    try {
      const response = await this.client.execute(request);
      const paypalOrder = response.result;

      // Find approval URL
      const approvalUrl = paypalOrder.links.find((link) => link.rel === 'approve')?.href;

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
          amountUsd: amountUsd,
          exchangeRate: rate,
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
    this.logger.log(`Capturing PayPal payment for order ${paypalOrderId}`);
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    try {
      const response = await this.client.execute(request);
      const capturedOrder = response.result;

      this.logger.log(`PayPal capture result for order ${paypalOrderId}: ${capturedOrder.status}`);

      // Extract order details
      const purchaseUnit = capturedOrder.purchase_units[0];
      const orderId = purchaseUnit.reference_id;
      const capture = purchaseUnit.payments.captures[0];
      const captureId = capture.id;

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
        amount: 0, // Not used for status update source of truth if we use DB amount
        status,
        paymentMethod: PaymentMethodEnum.PAYPAL,
        gatewayResponse: {
          captureId: captureId,
          captureStatus: capture.status,
          payerId: capturedOrder.payer?.payer_id,
          payerEmail: capturedOrder.payer?.email_address,
          raw: capturedOrder,
        },
      };
    } catch (error) {
      this.logger.error(`PayPal capture failed: ${error.message}`);
      throw new Error(`Failed to capture PayPal payment: ${error.message}`);
    }
  }

  /**
   * Verify PayPal webhook signature
   * Calls PayPal API to verify that the webhook actually came from them
   */
  async verifyWebhookSignature(
    headers: Record<string, any>,
    webhookEvent: Record<string, any>,
  ): Promise<boolean> {
    const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');
    if (!webhookId) {
      this.logger.warn('PAYPAL_WEBHOOK_ID not configured. Skipping signature verification.');
      return true; // Fallback to true if not configured (not recommended for production)
    }

    // We use a raw request because the SDK doesn't have a built-in class for this specific endpoint
    const request = {
      path: '/v1/notifications/verify-webhook-signature',
      verb: 'POST',
      body: {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await this.client.execute(request as any);
      return response.result.verification_status === 'SUCCESS';
    } catch (error) {
      this.logger.error(`PayPal webhook signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify PayPal webhook
   * For webhook events from PayPal
   */
  protected async doVerifyCallback(webhookData: Record<string, any>): Promise<CallbackData> {
    const eventType = webhookData.event_type;
    const resource = webhookData.resource;

    this.logger.log(`Processing PayPal webhook: ${eventType}`);

    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      // This is where we trigger CAPTURE
      const paypalOrderId = resource.id;
      return this.capturePayment(paypalOrderId);
    }

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = resource.id;
      const paypalOrderId =
        resource.supplementary_data?.related_ids?.order_id || resource.parent_payment; // Fallback
      const orderId = resource.custom_id || resource.invoice_id; // metadata reference

      return {
        orderId,
        transactionId: paypalOrderId,
        amount: parseFloat(resource.amount.value),
        status: TransactionStatus.SUCCESS,
        paymentMethod: PaymentMethodEnum.PAYPAL,
        gatewayResponse: {
          captureId,
          status: resource.status,
          raw: resource,
        },
      };
    }

    if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'PAYMENT.CAPTURE.DECLINED') {
      const paypalOrderId =
        resource.supplementary_data?.related_ids?.order_id || resource.parent_payment;
      return {
        orderId: resource.custom_id,
        transactionId: paypalOrderId,
        amount: parseFloat(resource.amount.value),
        status: TransactionStatus.FAILED,
        paymentMethod: PaymentMethodEnum.PAYPAL,
        gatewayResponse: resource,
      };
    }

    throw new Error(`Unsupported PayPal webhook event: ${eventType}`);
  }

  /**
   * Process PayPal refund
   */
  /**
   * Query PayPal order status
   * If status is APPROVED, trigger capture synchronously
   */
  async queryTransaction(paypalOrderId: string): Promise<CallbackData | null> {
    this.logger.log(`Querying PayPal order status: ${paypalOrderId}`);
    const request = new paypal.orders.OrdersGetRequest(paypalOrderId);

    try {
      const response = await this.client.execute(request);
      const paypalOrder = response.result;
      const status = paypalOrder.status;

      this.logger.log(`PayPal order ${paypalOrderId} status: ${status}`);

      if (status === 'APPROVED') {
        // Trigger capture synchronously
        return this.capturePayment(paypalOrderId);
      }

      if (status === 'COMPLETED') {
        const purchaseUnit = paypalOrder.purchase_units[0];
        const orderId = purchaseUnit.reference_id;

        return {
          orderId,
          transactionId: paypalOrderId,
          amount: 0,
          status: TransactionStatus.SUCCESS,
          paymentMethod: PaymentMethodEnum.PAYPAL,
          gatewayResponse: paypalOrder,
        };
      }

      if (status === 'CREATED' || status === 'PAYER_ACTION_REQUIRED') {
        const purchaseUnit = paypalOrder.purchase_units[0];
        const orderId = purchaseUnit.reference_id;

        return {
          orderId,
          transactionId: paypalOrderId,
          amount: 0,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethodEnum.PAYPAL,
          gatewayResponse: paypalOrder,
        };
      }

      if (status === 'VOIDED' || status === 'EXPIRED') {
        const purchaseUnit = paypalOrder.purchase_units[0];
        const orderId = purchaseUnit.reference_id;

        return {
          orderId,
          transactionId: paypalOrderId,
          amount: 0,
          status: TransactionStatus.FAILED,
          paymentMethod: PaymentMethodEnum.PAYPAL,
          gatewayResponse: paypalOrder,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`PayPal status query failed: ${error.message}`);
      return null;
    }
  }

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
