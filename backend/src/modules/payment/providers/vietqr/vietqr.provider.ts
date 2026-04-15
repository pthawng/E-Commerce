import { Injectable } from '@nestjs/common';
import {
  CallbackData,
  PaymentMethodEnum,
  PaymentResult,
  RefundResult,
  TransactionStatus,
} from '../../types/payment.types';
import { BasePaymentProvider } from '../base-payment.provider';

const VIETQR_BASE_URL = 'https://img.vietqr.io/image';

/**
 * VietQR Payment Provider (Production-Grade)
 *
 * Generates a unique, tamper-resistant transferCode per order.
 * Provides a dynamic QR code URL pre-filled with amount and description.
 * Confirmation is handled automatically via the VietQRMatchingService webhook.
 */
@Injectable()
export class VietQRProvider extends BasePaymentProvider {
  private readonly bankBin: string;
  private readonly accountNo: string;
  private readonly accountName: string;
  private readonly template: string;
  private readonly expireMinutes: number;

  constructor() {
    super('VietQRProvider');
    this.bankBin = process.env.VIETQR_BANK_BIN || '970422';
    this.accountNo = process.env.VIETQR_BANK_ACCOUNT_NO || '0000000000';
    this.accountName = process.env.VIETQR_BANK_ACCOUNT_NAME || 'SHOP';
    this.template = process.env.VIETQR_TEMPLATE || 'compact';
    this.expireMinutes = parseInt(process.env.VIETQR_EXPIRE_MINUTES || '20', 10);
  }

  /**
   * Create VietQR payment.
   * Returns a dynamic QR URL pre-filled with amount and unique transferCode.
   */
  protected async doCreatePayment(
    orderId: string,
    amount: number,
    metadata?: Record<string, any>,
  ): Promise<PaymentResult> {
    const transactionId = this.generateTransactionRef(orderId);

    // Build a unique, hard-to-guess transfer code:
    // Format: RP-{orderCode or short orderId}-{4 random alphanumeric chars}
    // e.g.  RP-ORD1234-X9K2
    const orderCode = metadata?.orderCode
      ? metadata.orderCode
          .replace(/[^A-Z0-9]/gi, '')
          .toUpperCase()
          .slice(-8)
      : orderId.replace(/-/g, '').toUpperCase().slice(-8);
    const randomSuffix = Math.random().toString(36).toUpperCase().slice(2, 6);
    const transferCode = `RP${orderCode}${randomSuffix}`;

    // Calculate expiry timestamp
    const expiresAt = new Date(Date.now() + this.expireMinutes * 60 * 1000).toISOString();

    // Build VietQR image URL (api.vietqr.io v2 format)
    const addInfo = encodeURIComponent(transferCode);
    const accountName = encodeURIComponent(this.accountName);
    const qrUrl = [
      `${VIETQR_BASE_URL}/${this.bankBin}-${this.accountNo}-${this.template}.jpg`,
      `?amount=${amount}`,
      `&addInfo=${addInfo}`,
      `&accountName=${accountName}`,
    ].join('');

    this.logger.log(
      `VietQR created | orderId=${orderId} | transferCode=${transferCode} | amount=${amount} | expiresAt=${expiresAt}`,
    );

    return {
      success: true,
      transactionId,
      message: `VietQR payment created. Transfer code: ${transferCode}`,
      metadata: {
        paymentMethod: 'VIETQR',
        amount,
        currency: 'VND',
        transferCode,
        qrUrl,
        bankBin: this.bankBin,
        accountNo: this.accountNo,
        accountName: this.accountName,
        expiresAt,
        expireMinutes: this.expireMinutes,
        note: `Nội dung chuyển khoản bắt buộc: ${transferCode}`,
      },
    };
  }

  /**
   * Verify VietQR callback.
   * Data comes from VietQRMatchingService after matching a bank transaction.
   */
  protected async doVerifyCallback(callbackData: Record<string, any>): Promise<CallbackData> {
    const { orderId, transactionId, amount, bankTransactionId, bankTransaction } = callbackData;

    return {
      orderId,
      transactionId,
      amount,
      status: TransactionStatus.SUCCESS,
      paymentMethod: PaymentMethodEnum.VIETQR,
      gatewayResponse: {
        bankTransactionId,
        bankTransaction,
        matchedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Process refund.
   * VietQR refunds are always manual (bank transfer back to customer).
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
      message: 'Refund recorded. Please complete the bank transfer manually.',
      metadata: {
        originalTransactionId: transactionId,
        reason,
        note: 'Manual bank refund required. Transfer funds back to the customer.',
      },
    };
  }

  getPaymentMethod(): PaymentMethodEnum {
    return PaymentMethodEnum.VIETQR;
  }
}
