import { OptionalAuth } from '@common/decorators/optional-auth.decorator';
import { Public } from '@common/decorators/public.decorator';
import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bull';
import { Request, Response } from 'express';
import { OwnershipRegistry } from '../security/ownership.registry';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmVietQRPaymentDto, RefundPaymentDto } from './dto/refund.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { PaymentService } from './payment.service';
import { CassoWebhookPayload, VietQRMatchingService } from './services/vietqr-matching.service';
import { PaymentMethodEnum } from './types/payment.types';

@ApiTags('Payment')
@Controller('payment')
@OptionalAuth()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly vietqrMatchingService: VietQRMatchingService,
    private readonly ownershipRegistry: OwnershipRegistry,
    @InjectQueue('payment_status') private readonly paymentQueue: Queue,
  ) {}

  /**
   * Create payment for an order
   */
  @Post('create')
  @ApiOperation({ summary: 'Create payment for an order' })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Payment created successfully',
        data: {
          transactionId: 'ORD-240202-1234_1706865600000',
          paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...',
          paymentMethod: 'VNPAY',
        },
      },
    },
  })
  async createPayment(@Body() dto: CreatePaymentDto, @Req() req: Request) {
    const ipAddr = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const orderAccessToken = req.headers['x-order-access-token'] as string;

    const principal = this.ownershipRegistry.createPrincipal(
      (req as any).user,
      (req as any).sessionId,
      orderAccessToken,
    );

    const result = await this.paymentService.createPayment(
      dto.orderId,
      dto.paymentMethod,
      principal,
      {
        returnUrl: dto.returnUrl,
        cancelUrl: dto.cancelUrl,
        ipAddr: dto.ipAddr || ipAddr,
        bankCode: dto.bankCode,
      },
    );

    return {
      transactionId: result.transactionId,
      paymentUrl: result.paymentUrl,
      paymentMethod: dto.paymentMethod,
      message: result.message,
    };
  }

  /**
   * VNPAY IPN Callback
   * This endpoint is called by VNPAY after payment
   */
  @Get('vnpay/callback')
  @Public()
  @ApiOperation({ summary: 'VNPAY payment callback (Browser Redirect)' })
  @ApiResponse({
    status: 200,
    description: 'Callback processed successfully',
  })
  async vnpayCallback(@Query() query: any, @Res() res: Response) {
    try {
      // Principal-level hardening: Execute full callback processing on redirect
      // even if IPN hasn't arrived. Unified lock in Service ensures safety.
      const verifiedData = await this.paymentService.processCallback(
        PaymentMethodEnum.VNPAY,
        query,
      );

      const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:8080');
      redirectUrl.pathname = '/payment/result';
      redirectUrl.searchParams.set('orderId', verifiedData.orderId);
      redirectUrl.searchParams.set('status', verifiedData.status);
      redirectUrl.searchParams.set('transactionId', verifiedData.transactionId);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      this.logger.error(`VNPAY Callback Error: ${error.message}`);
      const errorUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:8080');
      errorUrl.pathname = '/payment/error';
      errorUrl.searchParams.set('message', error.message);

      return res.redirect(errorUrl.toString());
    }
  }

  @Get('vnpay/ipn')
  @Public()
  @ApiOperation({ summary: 'VNPAY IPN handler' })
  async vnpayIpn(@Query() query: any) {
    this.logger.log('Received VNPAY IPN notification');

    try {
      // Process callback synchronously and atomically (Source of Truth)
      // This is required by VNPAY to ensure reliability before returning RspCode: 00
      await this.paymentService.processCallback(PaymentMethodEnum.VNPAY, query);

      // VNPAY expects this specific JSON response for IPN success
      return { RspCode: '00', Message: 'Confirm success' };
    } catch (error) {
      this.logger.error(`VNPAY IPN Error: ${error.message}`);

      // Specific Error Mapping for VNPay IPN Spec
      // 97: Invalid signature
      if (error.message === 'Invalid VNPAY signature') {
        return { RspCode: '97', Message: 'Invalid signature' };
      }

      // 01: Order not found
      if (error instanceof NotFoundException) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      // 02: Order already confirmed
      if (
        error instanceof ConflictException ||
        (error instanceof BadRequestException && error.message.includes('transition'))
      ) {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      // 04: Invalid amount
      if (error instanceof BadRequestException && error.message.includes('Amount mismatch')) {
        return { RspCode: '04', Message: 'Invalid amount' };
      }

      // 99: Other errors (System error)
      return { RspCode: '99', Message: 'Input data invalid' };
    }
  }

  /**
   * PayPal Webhook Handler
   * Receives webhook events from PayPal (Source of Truth)
   */
  @Post('paypal/webhook')
  @Public()
  @ApiOperation({ summary: 'PayPal webhook handler' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async paypalWebhook(@Body() webhookData: any, @Req() req: Request) {
    this.logger.log(`Received PayPal Webhook: ${webhookData.event_type}`);

    // Extract required headers for signature verification
    const headers = {
      'paypal-auth-algo': req.headers['paypal-auth-algo'],
      'paypal-cert-url': req.headers['paypal-cert-url'],
      'paypal-transmission-id': req.headers['paypal-transmission-id'],
      'paypal-transmission-sig': req.headers['paypal-transmission-sig'],
      'paypal-transmission-time': req.headers['paypal-transmission-time'],
    };

    // Add to background queue for reliable processing
    await this.paymentQueue.add(
      'process_callback',
      {
        paymentMethod: PaymentMethodEnum.PAYPAL,
        callbackData: webhookData,
        headers,
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );

    return { received: true };
  }

  /**
   * Process refund for an order
   */
  @Post('refund/:orderId')
  @ApiOperation({ summary: 'Process refund for an order' })
  @ApiResponse({
    status: 200,
    description: 'Refund processed successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Refund processed successfully',
        data: {
          refundTransactionId: 'REFUND_123_1706865600000',
          amount: 100000,
          status: 'success',
        },
      },
    },
  })
  async refundPayment(@Param('orderId') orderId: string, @Body() dto: RefundPaymentDto) {
    const result = await this.paymentService.processRefund(
      orderId,
      dto.amount,
      dto.reason,
      dto.restoreInventory,
    );

    return {
      refundTransactionId: result.refundTransactionId,
      amount: result.amount,
      status: result.success ? 'success' : 'failed',
      message: result.message,
    };
  }

  /**
   * Confirm VIETQR payment (staff only)
   */
  @Post('vietqr/webhook')
  @Public()
  @ApiOperation({ summary: 'VietQR Bank Transfer Webhook (Casso / SePay)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async vietqrWebhook(@Body() payload: CassoWebhookPayload, @Req() req: Request) {
    // ─── Security ──────────────────────────────────────────────────────
    const apiKey = (req.headers['x-api-key'] as string) || '';
    const sourceIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    this.vietqrMatchingService.verifyWebhookRequest(apiKey, sourceIp);
    // ─────────────────────────────────────────────────────────────────

    this.logger.log(
      `VietQR webhook received from IP=${sourceIp}, transactions=${payload?.data?.length ?? 0}`,
    );

    const result = await this.vietqrMatchingService.processCassoWebhook(payload);
    return { success: true, ...result };
  }

  @Post('vietqr/confirm')
  @ApiOperation({ summary: 'Confirm VIETQR payment (staff only)' })
  @ApiResponse({
    status: 200,
    description: 'VIETQR payment confirmed',
  })
  async confirmVietQRPayment(@Body() dto: ConfirmVietQRPaymentDto, @Req() req: Request) {
    // In production, get user ID from JWT token
    const confirmedBy = (req as any).user?.id || 'system';

    await this.paymentService.confirmVietQRPayment(dto.orderId, dto.amount, confirmedBy, dto.note);

    return {
      message: 'VietQR payment confirmed successfully',
    };
  }

  /**
   * Get payment status for an order
   */
  @Get('status/:orderId')
  @ApiOperation({ summary: 'Get payment status for an order' })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          orderCode: 'ORD-240202-1234',
          paymentStatus: 'paid',
          totalAmount: 100000,
          transactions: [
            {
              id: '456e7890-e89b-12d3-a456-426614174000',
              type: 'payment',
              status: 'success',
              provider: 'VNPAY',
              amount: 100000,
              createdAt: '2024-02-02T10:00:00Z',
            },
          ],
        },
      },
    },
  })
  async getPaymentStatus(@Param('orderId') orderId: string, @Req() req: Request) {
    const orderAccessToken = req.headers['x-order-access-token'] as string;
    const principal = this.ownershipRegistry.createPrincipal(
      (req as any).user,
      (req as any).sessionId,
      orderAccessToken,
    );

    return await this.paymentService.getPaymentProcessingStatus(orderId, principal);
  }

  /**
   * Get all transactions for admin (paginated)
   */
  async findAllTransactions(@Query() query: TransactionQueryDto) {
    return await this.paymentService.findTransactions(query);
  }
}
