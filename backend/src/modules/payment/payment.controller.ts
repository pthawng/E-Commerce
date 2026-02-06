import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '@common/decorators/public.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmCODPaymentDto, RefundPaymentDto } from './dto/refund.dto';
import { PaymentService } from './payment.service';
import { PaymentMethodEnum } from './types/payment.types';
import { OrderPaymentService } from '@modules/order/services/order-payment.service';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly orderPaymentService: OrderPaymentService,
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
            const callbackData = await this.paymentService.processCallback(
                PaymentMethodEnum.VNPAY,
                query,
            );

            // NEW: Confirm or cancel order based on payment result
            if (callbackData.status === 'success') {
                await this.orderPaymentService.confirmOrder(callbackData.orderId);
            } else {
                await this.orderPaymentService.cancelOrder(
                    callbackData.orderId,
                    'Payment failed',
                );
            }

            // Redirect to frontend with result
            const redirectUrl = new URL(
                process.env.FRONTEND_URL || 'http://localhost:5173',
            );
            redirectUrl.pathname = '/payment/result';
            redirectUrl.searchParams.set('orderId', callbackData.orderId);
            redirectUrl.searchParams.set('status', callbackData.status);
            redirectUrl.searchParams.set('transactionId', callbackData.transactionId);

            return res.redirect(redirectUrl.toString());
        } catch (error) {
            // Redirect to error page
            const errorUrl = new URL(
                process.env.FRONTEND_URL || 'http://localhost:5173',
            );
            errorUrl.pathname = '/payment/error';
            errorUrl.searchParams.set('message', error.message);

            return res.redirect(errorUrl.toString());
        }
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
        const callbackData = await paypalProvider.capturePayment(paypalOrderId);

        // Update order status
        await this.paymentService.processCallback(
            PaymentMethodEnum.PAYPAL,
            callbackData,
        );

        // NEW: Confirm or cancel order based on payment result
        if (callbackData.status === 'success') {
            await this.orderPaymentService.confirmOrder(callbackData.orderId);
        } else {
            await this.orderPaymentService.cancelOrder(
                callbackData.orderId,
                'Payment failed',
            );
        }

        return {
            orderId: callbackData.orderId,
            status: callbackData.status,
            transactionId: callbackData.transactionId,
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
    async paypalWebhook(@Body() webhookData: any) {
        // In production, verify webhook signature here
        // For now, we'll just process the event

        await this.paymentService.processCallback(
            PaymentMethodEnum.PAYPAL,
            webhookData,
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
     * Confirm COD payment (staff only)
     */
    @Post('cod/confirm')
    @ApiOperation({ summary: 'Confirm COD payment (staff only)' })
    @ApiResponse({
        status: 200,
        description: 'COD payment confirmed',
    })
    async confirmCODPayment(
        @Body() dto: ConfirmCODPaymentDto,
        @Req() req: Request,
    ) {
        // In production, get user ID from JWT token
        const confirmedBy = (req as any).user?.id || 'system';

        await this.paymentService.confirmCODPayment(
            dto.orderId,
            dto.amount,
            confirmedBy,
            dto.note,
        );

        return {
            message: 'COD payment confirmed successfully',
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
        return await this.paymentService.getPaymentStatus(orderId);
    }
}
