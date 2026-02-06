import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasePaymentProvider } from '../base-payment.provider';
import {
    CallbackData,
    PaymentMethodEnum,
    PaymentResult,
    RefundResult,
    TransactionStatus,
} from '../../types/payment.types';
import {
    VNPAY_COMMAND,
    VNPAY_CURRENCY_CODE,
    VNPAY_LOCALE,
    VNPAY_ORDER_TYPE,
    VNPAY_RESPONSE_CODE,
    VNPAY_VERSION,
} from './vnpay.constants';
import {
    buildVNPayUrl,
    formatVNPayDate,
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

    constructor(private readonly configService: ConfigService) {
        super('VNPayProvider');

        // Load configuration with fallback values
        this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
        this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';
        this.vnpUrl = this.configService.get<string>('VNPAY_URL') || '';
        this.returnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || '';
        this.apiUrl = this.configService.get<string>('VNPAY_API_URL') || '';

        // Validate configuration - only warn instead of throw
        if (!this.tmnCode || !this.hashSecret || !this.vnpUrl) {
            this.logger.warn(
                'VNPAY configuration is incomplete. VNPAY payments will not work.',
            );
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
        const orderInfo = metadata?.orderInfo || `Payment for order ${orderId}`;

        // Build VNPAY parameters
        const vnpParams: Record<string, any> = {
            vnp_Version: VNPAY_VERSION,
            vnp_Command: VNPAY_COMMAND.PAY,
            vnp_TmnCode: this.tmnCode,
            vnp_Amount: this.formatAmount(amount) * 100, // VNPAY requires amount in smallest unit (VND * 100)
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
            },
        };
    }

    /**
     * Verify VNPAY callback (IPN - Instant Payment Notification)
     * Called when user completes payment
     */
    protected async doVerifyCallback(
        callbackData: Record<string, any>,
    ): Promise<CallbackData> {
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
        let status: TransactionStatus;
        if (responseCode === VNPAY_RESPONSE_CODE.SUCCESS) {
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
     * Process VNPAY refund
     * Note: VNPAY refund requires API integration with merchant credentials
     */
    protected async doProcessRefund(
        transactionId: string,
        amount: number,
        reason?: string,
    ): Promise<RefundResult> {
        // For production, this would call VNPAY refund API
        // For now, we'll create a refund record in our system
        // VNPAY refund API requires additional merchant authentication

        const refundTxnRef = `REFUND_${transactionId}_${Date.now()}`;

        this.logger.warn(
            `VNPAY refund API not fully implemented. Creating refund record: ${refundTxnRef}`,
        );

        // In production, you would:
        // 1. Call VNPAY refund API with proper authentication
        // 2. Verify refund response
        // 3. Return actual refund result

        return {
            success: true,
            refundTransactionId: refundTxnRef,
            amount,
            message: 'Refund request created. Manual processing may be required.',
            metadata: {
                originalTransactionId: transactionId,
                reason,
                note: 'VNPAY refunds may require manual approval',
            },
        };
    }

    getPaymentMethod(): PaymentMethodEnum {
        return PaymentMethodEnum.VNPAY;
    }
}
