import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
    Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmVietQRPaymentDto, RefundPaymentDto } from './dto/refund.dto';
import { PaymentService } from './payment.service';
import { VietQRMatchingService, BankTransaction } from './services/vietqr-matching.service';
import { PaymentMethodEnum } from './types/payment.types';
import { OrderPaymentService } from '@modules/order/services/order-payment.service';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
    private readonly logger = new Logger(PaymentController.name);

    constructor(
        private readonly paymentService: PaymentService,
        private readonly vietqrMatchingService: VietQRMatchingService,
        @InjectQueue('payment_status') private readonly paymentQueue: Queue,
    ) { }

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

        const result = await this.paymentService.createPayment(
            dto.orderId,
            dto.paymentMethod,
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
    @ApiOperation({ summary: 'VNPAY payment callback (IPN)' })
    @ApiResponse({
        status: 200,
        description: 'Callback processed successfully',
    })
    async vnpayCallback(@Query() query: any, @Res() res: Response) {
        try {
            // VNPAY IPN and Return usually use the same endpoint but different behaviors
            // 1. Add to background queue for Source of Truth update (Reliability)
            await this.paymentQueue.add('process_callback', {
                paymentMethod: PaymentMethodEnum.VNPAY,
                callbackData: query,
            }, {
                attempts: 5,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: true,
            });

            // 2. For the user (Browser redirect)
            // We verify synchronously ONLY for the redirect response, not for the DB update
            const provider = this.paymentService.getProvider(PaymentMethodEnum.VNPAY);
            const verifiedData = await provider.verifyCallback(query);

            const redirectUrl = new URL(
                process.env.FRONTEND_URL || 'http://localhost:5173',
            );
            redirectUrl.pathname = '/payment/result';
            redirectUrl.searchParams.set('orderId', verifiedData.orderId);
            redirectUrl.searchParams.set('status', verifiedData.status);
            redirectUrl.searchParams.set('transactionId', verifiedData.transactionId);

            return res.redirect(redirectUrl.toString());
        } catch (error) {
            this.logger.error(`VNPAY Callback Error: ${error.message}`);
            const errorUrl = new URL(
                process.env.FRONTEND_URL || 'http://localhost:5173',
            );
            errorUrl.pathname = '/payment/error';
            errorUrl.searchParams.set('message', error.message);

            return res.redirect(errorUrl.toString());
        }
    }

    /**
     * VNPAY IPN Handler
     * Required by VNPAY for server-to-server confirmation
     */
    @Get('vnpay/ipn')
    @Public()
    @ApiOperation({ summary: 'VNPAY IPN handler' })
    async vnpayIpn(@Query() query: any) {
        this.logger.log('Received VNPAY IPN notification');
        
        // Add to background queue
        await this.paymentQueue.add('process_callback', {
            paymentMethod: PaymentMethodEnum.VNPAY,
            callbackData: query,
        }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
        });

        // VNPAY expects this specific JSON response for IPN
        return { RspCode: '00', Message: 'Confirm success' };
    }

    /**
     * PayPal Payment Capture
     * Called after user approves payment on PayPal
     */
    @Post('paypal/capture/:paypalOrderId')
    @Public()
    @ApiOperation({ summary: 'Capture PayPal payment after approval' })
    @ApiResponse({
        status: 200,
        description: 'Payment captured successfully',
    })
    async capturePayPalPayment(@Param('paypalOrderId') paypalOrderId: string) {
        const paypalProvider = this.paymentService.getPayPalProvider();
        const capturedData = await paypalProvider.capturePayment(paypalOrderId);

        // Update order status (Includes inventory and retry logic)
        const result = await this.paymentService.processCallback(
            PaymentMethodEnum.PAYPAL,
            capturedData,
        );

        return {
            orderId: result.orderId || capturedData.orderId,
            status: result.status || capturedData.status,
            transactionId: result.transactionId || capturedData.transactionId,
            message: 'Payment captured successfully',
        };
    }

    /**
     * PayPal Webhook Handler
     * Receives webhook events from PayPal
     */
    @Post('paypal/webhook')
    @Public()
    @ApiOperation({ summary: 'PayPal webhook handler' })
    @ApiResponse({
        status: 200,
        description: 'Webhook processed successfully',
    })
    async paypalWebhook(@Body() webhookData: any, @Req() req: Request) {
        this.logger.log('Received PayPal Webhook notification');
        
        // Extract required headers for signature verification
        const headers = {
            'paypal-auth-algo': req.headers['paypal-auth-algo'],
            'paypal-cert-url': req.headers['paypal-cert-url'],
            'paypal-transmission-id': req.headers['paypal-transmission-id'],
            'paypal-transmission-sig': req.headers['paypal-transmission-sig'],
            'paypal-transmission-time': req.headers['paypal-transmission-time'],
        };

        // Add to background queue
        await this.paymentQueue.add('process_callback', {
            paymentMethod: PaymentMethodEnum.PAYPAL,
            callbackData: webhookData,
            headers, // Support for signature verification in the processor
        }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
        });

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
    async refundPayment(
        @Param('orderId') orderId: string,
        @Body() dto: RefundPaymentDto,
    ) {
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
    @ApiOperation({ summary: 'VietQR Bank Transfer Webhook (e.g. from SePay/Casso)' })
    @ApiResponse({ status: 200, description: 'Webhook processed' })
    async vietqrWebhook(@Body() bankTx: BankTransaction) {
        this.logger.log(`Received VietQR Bank Webhook: ${bankTx.amount} - ${bankTx.description}`);
        const matched = await this.vietqrMatchingService.processIncomingTransaction(bankTx);
        return { success: matched };
    }

    @Post('vietqr/confirm')
    @ApiOperation({ summary: 'Confirm VIETQR payment (staff only)' })
    @ApiResponse({
        status: 200,
        description: 'VIETQR payment confirmed',
    })
    async confirmVietQRPayment(
        @Body() dto: ConfirmVietQRPaymentDto,
        @Req() req: Request,
    ) {
        // In production, get user ID from JWT token
        const confirmedBy = (req as any).user?.id || 'system';

        await this.paymentService.confirmVietQRPayment(
            dto.orderId,
            dto.amount,
            confirmedBy,
            dto.note,
        );

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
    async getPaymentStatus(@Param('orderId') orderId: string) {
        return await this.paymentService.getPaymentProcessingStatus(orderId);
    }

    /**
     * Get all transactions for admin (paginated)
     */
    @Get('admin/all')
    @ApiOperation({ summary: 'Get all transactions for admin (paginated)' })
    @ApiResponse({
        status: 200,
        description: 'Transactions retrieved successfully',
    })
    async findAllTransactions(@Query() query: {
        page?: number;
        limit?: number;
        status?: string;
        provider?: string;
        orderCode?: string;
    }) {
        return await this.paymentService.findTransactions(query);
    }
}
