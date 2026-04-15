import { Injectable, Logger } from '@nestjs/common';
import { PayPalProvider } from '../providers/paypal/paypal.provider';
import { VietQRProvider } from '../providers/vietqr/vietqr.provider';
import { VNPayProvider } from '../providers/vnpay/vnpay.provider';

/**
 * Payment Gateway Service
 *
 * Handles payment URL generation for different providers
 * Extends existing PaymentService functionality
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  constructor(
    private readonly vnpayProvider: VNPayProvider,
    private readonly paypalProvider: PayPalProvider,
    private readonly vietqrProvider: VietQRProvider,
  ) {}

  /**
   * Generate payment URL for order
   *
   * @param orderId - Order ID
   * @param orderCode - Order code for display
   * @param amount - Payment amount
   * @param provider - Payment provider (COD/VNPAY/PAYPAL)
   * @param returnUrl - Optional return URL
   * @param cancelUrl - Optional cancel URL
   * @returns Payment URL or null for COD
   */
  async generatePaymentUrl(
    orderId: string,
    orderCode: string,
    amount: number,
    provider: string,
    returnUrl?: string,
    cancelUrl?: string,
  ): Promise<string | null> {
    this.logger.log(
      `Generating payment URL: provider=${provider}, orderId=${orderId}, amount=${amount}`,
    );

    // VietQR (manual) doesn't need payment URL (handled by frontend display)
    if (provider === 'VIETQR' || provider === 'COD') {
      return null;
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');

    const metadata = {
      orderId,
      orderCode,
      returnUrl: returnUrl || `${frontendUrl}/payment-result`,
      cancelUrl: cancelUrl || `${frontendUrl}/payment-result?status=failed`,
    };

    try {
      if (provider === 'VNPAY') {
        const result = await this.vnpayProvider.createPayment(orderId, amount, metadata);
        return result.paymentUrl || null;
      }

      if (provider === 'PAYPAL') {
        const result = await this.paypalProvider.createPayment(orderId, amount, metadata);
        return result.paymentUrl || null;
      }

      throw new Error(`Unsupported payment provider: ${provider}`);
    } catch (error) {
      this.logger.error(`Failed to generate payment URL for provider ${provider}`, error);
      throw error;
    }
  }

  /**
   * Handle payment callback (idempotent)
   *
   * @param provider - Payment provider
   * @param callbackData - Callback data from gateway
   * @returns Callback result with success status and order info
   */
  async handleCallback(
    provider: string,
    callbackData: Record<string, any>,
  ): Promise<{
    success: boolean;
    orderId: string;
    orderCode: string;
    transactionId: string;
    amount: number;
    message: string;
    metadata?: Record<string, any>;
  }> {
    this.logger.log(`Processing callback from ${provider}`);

    try {
      let verifiedData: any;

      if (provider === 'VNPAY') {
        verifiedData = await this.vnpayProvider.verifyCallback(callbackData);
      } else if (provider === 'PAYPAL') {
        verifiedData = await this.paypalProvider.verifyCallback(callbackData);
      } else {
        throw new Error(`Unsupported payment provider: ${provider}`);
      }

      return {
        success: verifiedData.success,
        orderId: verifiedData.orderId,
        orderCode: verifiedData.orderInfo || '',
        transactionId: verifiedData.transactionId,
        amount: verifiedData.amount,
        message: verifiedData.success ? 'Payment successful' : 'Payment failed',
        metadata: verifiedData.metadata,
      };
    } catch (error) {
      this.logger.error(`Callback verification failed for ${provider}`, error);
      throw error;
    }
  }
}
