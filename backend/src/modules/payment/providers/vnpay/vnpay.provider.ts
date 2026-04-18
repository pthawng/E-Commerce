import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResilientHttpClient } from '@common/services/resilient-http.client';
import {
  CallbackData,
  PaymentMethodEnum,
  PaymentResult,
  RefundResult,
  TransactionStatus,
} from '../../types/payment.types';
import { BasePaymentProvider } from '../base-payment.provider';
import {
  VNPAY_COMMAND,
  VNPAY_CURRENCY_CODE,
  VNPAY_LOCALE,
  VNPAY_ORDER_TYPE,
  VNPAY_RESPONSE_CODE,
  VNPAY_TRANSACTION_TYPE,
  VNPAY_VERSION,
} from './vnpay.constants';
import {
  buildVNPayUrl,
  formatVNPayDate,
  generateVNPayApiHash,
  generateVNPayHash,
  generateVNPayTxnRef,
  verifyVNPaySignature,
} from './vnpay.utils';

/**
 * VNPAY Payment Provider
 * Implements VNPAY payment gateway integration
 */
@Injectable()
export class VNPayProvider extends BasePaymentProvider {
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly vnpUrl: string;
  private readonly returnUrl: string;
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly resilientHttpClient: ResilientHttpClient,
  ) {
    super('VNPayProvider');

    // Load configuration from environment
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';
    this.vnpUrl = this.configService.get<string>('VNPAY_URL') || '';
    this.returnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || '';
    this.apiUrl = this.configService.get<string>('VNPAY_API_URL') || '';

    // Registration check and logging
    this.logger.log(`VNPayProvider initialized for Merchant: ${this.tmnCode}`);

    if (!this.tmnCode || !this.hashSecret || !this.vnpUrl) {
      this.logger.error('VNPay configuration is incomplete! Check your .env file.');
    }
  }

  /**
   * Create VNPAY payment
   * Generates payment URL for user to complete payment
   */
  protected async doCreatePayment(
    orderId: string,
    amount: number,
    metadata?: Record<string, any>,
  ): Promise<PaymentResult> {
    const txnRef = generateVNPayTxnRef(orderId);
    const createDate = formatVNPayDate();
    const ipAddr = metadata?.ipAddr || '127.0.0.1';
    const orderInfo = `Thanh_toan_don_hang_${orderId.slice(-8)}`;

    // Build VNPAY parameters
    const vnpParams: Record<string, any> = {
      vnp_Version: VNPAY_VERSION,
      vnp_Command: VNPAY_COMMAND.PAY,
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: Math.round(amount * 100),
      vnp_CurrCode: VNPAY_CURRENCY_CODE,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: VNPAY_ORDER_TYPE.OTHER,
      vnp_Locale: VNPAY_LOCALE.VN,
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Add optional bank code if provided
    if (metadata?.bankCode) {
      vnpParams.vnp_BankCode = metadata.bankCode;
    }

    // Generate secure hash
    const secureHash = generateVNPayHash(vnpParams, this.hashSecret);
    vnpParams.vnp_SecureHash = secureHash;

    // Build payment URL
    const paymentUrl = buildVNPayUrl(this.vnpUrl, vnpParams);

    return {
      success: true,
      transactionId: txnRef,
      paymentUrl,
      message: 'VNPAY payment URL generated successfully',
      metadata: {
        txnRef,
        amount: vnpParams.vnp_Amount,
        vnp_CreateDate: createDate,
      },
    };
  }

  /**
   * Verify VNPAY callback (IPN - Instant Payment Notification)
   * Called when user completes payment
   */
  protected async doVerifyCallback(callbackData: Record<string, any>): Promise<CallbackData> {
    // Verify signature
    const isValid = verifyVNPaySignature(callbackData, this.hashSecret);

    if (!isValid) {
      throw new Error('Invalid VNPAY signature');
    }

    // Extract data
    const responseCode = callbackData.vnp_ResponseCode;
    const txnRef = callbackData.vnp_TxnRef;
    const amount = parseInt(callbackData.vnp_Amount) / 100; // Convert back from smallest unit
    const transactionNo = callbackData.vnp_TransactionNo;

    // Extract orderId from txnRef (format: orderId_timestamp)
    const orderId = txnRef.split('_')[0];

    // Determine transaction status
    const transactionStatus = callbackData.vnp_TransactionStatus;

    // VNPAY 2.1.0: vnp_ResponseCode '00' is request success,
    // vnp_TransactionStatus '00' is payment success
    let status: TransactionStatus;
    if (responseCode === VNPAY_RESPONSE_CODE.SUCCESS && transactionStatus === '00') {
      status = TransactionStatus.SUCCESS;
    } else {
      status = TransactionStatus.FAILED;
    }

    return {
      orderId,
      transactionId: txnRef,
      amount,
      status,
      paymentMethod: PaymentMethodEnum.VNPAY,
      gatewayResponse: {
        responseCode,
        transactionNo,
        bankCode: callbackData.vnp_BankCode,
        cardType: callbackData.vnp_CardType,
        payDate: callbackData.vnp_PayDate,
      },
    };
  }

  /**
   * Query transaction status from VNPay (QueryDR)
   */
  async queryTransaction(
    transactionId: string,
    metadata?: Record<string, any>,
  ): Promise<CallbackData | null> {
    this.logger.log(`Querying transaction status for ${transactionId}`);

    const requestId = Date.now().toString();
    const createDate = formatVNPayDate();
    const ipAddr = '127.0.0.1';

    // Use original create date from metadata if available (CRITICAL for VNPay QueryDR)
    const transactionDate = metadata?.vnp_CreateDate;

    if (!transactionDate) {
      this.logger.error(
        `Missing vnp_CreateDate for transaction ${transactionId}! Reconciliation will likely fail.`,
      );
      return null;
    }

    const data = {
      vnp_RequestId: requestId,
      vnp_Version: VNPAY_VERSION,
      vnp_Command: VNPAY_COMMAND.QUERY_DR,
      vnp_TmnCode: this.tmnCode,
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: `Query transaction ${transactionId}`,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: createDate,
      vnp_IpAddr: ipAddr,
    };

    // Generate HMAC SHA512 of piped string
    // Format: vnp_RequestId|vnp_Version|vnp_Command|vnp_TmnCode|vnp_TxnRef|vnp_TransactionDate|vnp_CreateDate|vnp_IpAddr|vnp_OrderInfo
    const signData = [
      data.vnp_RequestId,
      data.vnp_Version,
      data.vnp_Command,
      data.vnp_TmnCode,
      data.vnp_TxnRef,
      data.vnp_TransactionDate,
      data.vnp_CreateDate,
      data.vnp_IpAddr,
      data.vnp_OrderInfo,
    ].join('|');

    const secureHash = generateVNPayApiHash(signData, this.hashSecret);

    try {
      const result = await this.resilientHttpClient.post<any>(this.apiUrl, {
        ...data,
        vnp_SecureHash: secureHash
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (result.vnp_ResponseCode === VNPAY_RESPONSE_CODE.SUCCESS) {
        // Determine status based on vnp_TransactionStatus
        let status: TransactionStatus;
        // 00: Success, 01: Incomplete, 02: Error, 04: Refunded, 05: Processing refund
        if (result.vnp_TransactionStatus === '00') {
          status = TransactionStatus.SUCCESS;
        } else if (result.vnp_TransactionStatus === '01') {
          status = TransactionStatus.PENDING;
        } else {
          status = TransactionStatus.FAILED;
        }

        return {
          orderId: transactionId.split('_')[0],
          transactionId: transactionId,
          amount: parseInt(result.vnp_Amount) / 100,
          status,
          paymentMethod: PaymentMethodEnum.VNPAY,
          gatewayResponse: result,
        };
      }

      this.logger.warn(`VNPAY QueryDR failed for ${transactionId}: ${result.vnp_Message}`);
      return null;
    } catch (error) {
      this.logger.error(`Error querying VNPAY transaction: ${error.message}`);
      return null;
    }
  }

  /**
   * Process VNPAY refund
   */
  protected async doProcessRefund(
    transactionId: string,
    amount: number,
    reason?: string,
  ): Promise<RefundResult> {
    this.logger.log(`Processing VNPAY refund for ${transactionId}, amount: ${amount}`);

    const requestId = Date.now().toString();
    const createDate = formatVNPayDate();
    const ipAddr = '127.0.0.1';

    const data: Record<string, any> = {
      vnp_RequestId: requestId,
      vnp_Version: VNPAY_VERSION,
      vnp_Command: VNPAY_COMMAND.REFUND,
      vnp_TmnCode: this.tmnCode,
      vnp_TransactionType: VNPAY_TRANSACTION_TYPE.FULL_REFUND,
      vnp_TxnRef: transactionId,
      vnp_Amount: this.formatAmount(amount) * 100,
      vnp_OrderInfo: reason || `Refund for transaction ${transactionId}`,
      vnp_TransactionDate: createDate, // This should ideally be the original create date
      vnp_CreateBy: 'system',
      vnp_CreateDate: createDate,
      vnp_IpAddr: ipAddr,
    };

    // Hash: vnp_RequestId|vnp_Version|vnp_Command|vnp_TmnCode|vnp_TransactionType|vnp_TxnRef|vnp_Amount|vnp_TransactionNo|vnp_TransactionDate|vnp_CreateBy|vnp_CreateDate|vnp_IpAddr|vnp_OrderInfo
    const signData = [
      data.vnp_RequestId,
      data.vnp_Version,
      data.vnp_Command,
      data.vnp_TmnCode,
      data.vnp_TransactionType,
      data.vnp_TxnRef,
      data.vnp_Amount,
      '', // vnp_TransactionNo (optional)
      data.vnp_TransactionDate,
      data.vnp_CreateBy,
      data.vnp_CreateDate,
      data.vnp_IpAddr,
      data.vnp_OrderInfo,
    ].join('|');

    const secureHash = generateVNPayApiHash(signData, this.hashSecret);

    try {
      const result = await this.resilientHttpClient.post<any>(this.apiUrl, {
        ...data,
        vnp_SecureHash: secureHash
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (result.vnp_ResponseCode === VNPAY_RESPONSE_CODE.SUCCESS) {
        return {
          success: true,
          refundTransactionId: result.vnp_ResponseId || `REFUND_${transactionId}`,
          amount,
          message: 'Refund processed successfully',
          metadata: result,
        };
      }

      throw new Error(`VNPAY refund failed: ${result.vnp_Message || result.vnp_ResponseCode}`);
    } catch (error) {
      this.logger.error(`Error processing VNPAY refund: ${error.message}`);
      throw error;
    }
  }

  getPaymentMethod(): PaymentMethodEnum {
    return PaymentMethodEnum.VNPAY;
  }
}
