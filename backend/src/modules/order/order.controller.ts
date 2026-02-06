import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CurrentSession } from 'src/common/decorators/current-session.decorator';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt.guard';
import { RequestUserPayload } from 'src/common/types/jwt.types';
import { JwtAccessGuard } from 'src/modules/auth/guard/access-jwt.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderWithPaymentDto } from './dto/create-order-with-payment.dto';
import { OrderPaymentResponseDto } from './dto/order-payment-response.dto';
import { OrderService } from './order.service';
import { OrderPaymentService } from './services/order-payment.service';

@ApiTags('Order')
@Controller('orders')
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly orderPaymentService: OrderPaymentService,
    ) { }

    // -------------------------
    // 1. CHECKOUT (Create Order)
    // -------------------------
    @Post()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo đơn hàng từ giỏ hàng (Checkout)' })
    createOrder(
        @Body() dto: CreateOrderDto,
        @Req() req: { user?: RequestUserPayload },
        @CurrentSession() sessionId?: string,
    ) {
        return this.orderService.createOrder(req.user?.userId, sessionId, dto);
    }

    // -------------------------
    // 2. GET MY ORDERS
    // -------------------------
    // -------------------------
    @Get()
    @UseGuards(JwtAccessGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách đơn hàng của tôi (Chỉ User)' })
    getMyOrders(@Req() req: { user: RequestUserPayload }) {
        return this.orderService.getMyOrders(req.user.userId);
    }

    // -------------------------
    // 3. GET ORDER DETAIL
    // -------------------------
    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Chi tiết đơn hàng' })
    getOrder(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() req: { user?: RequestUserPayload },
    ) {
        return this.orderService.getOrder(id, req.user?.userId);
    }

    // -------------------------
    // 4. CREATE ORDER WITH PAYMENT (NEW)
    // -------------------------
    @Post('create-with-payment')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create order with payment integration',
        description: 'Creates order, reserves inventory, and initiates payment flow',
    })
    @ApiResponse({
        status: 201,
        description: 'Order created successfully',
        type: OrderPaymentResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request (empty cart, invalid data)',
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict (insufficient stock)',
    })
    async createOrderWithPayment(
        @Body() dto: CreateOrderWithPaymentDto,
        @Req() req: { user?: RequestUserPayload },
        @CurrentSession() sessionId?: string,
    ): Promise<OrderPaymentResponseDto> {
        return this.orderPaymentService.createOrderWithPayment(
            dto,
            req.user?.userId,
            sessionId,
        );
    }

    // -------------------------
    // 5. GET ORDER STATUS (NEW)
    // -------------------------
    @Get(':id/status')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({
        summary: 'Get order status',
        description: 'Check order status with remaining payment time',
    })
    @ApiQuery({
        name: 'sessionId',
        required: false,
        description: 'Session ID for guest orders',
    })
    @ApiResponse({
        status: 200,
        description: 'Order status retrieved',
    })
    async getOrderStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query('sessionId') sessionId?: string,
        @Req() req?: { user?: RequestUserPayload },
    ) {
        const order = await this.orderService.getOrder(id, req?.user?.userId);

        // Calculate remaining time for pending_payment orders
        let remainingSeconds = 0;
        let canPay = false;
        let canCancel = false;

        if (order.status === 'pending_payment' && order.paymentDeadline) {
            const now = new Date();
            const deadline = new Date(order.paymentDeadline);
            remainingSeconds = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
            canPay = remainingSeconds > 0;
            canCancel = true;
        }

        return {
            id: order.id,
            code: order.code,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentDeadline: order.paymentDeadline,
            remainingSeconds,
            canCancel,
            canPay,
        };
    }

    // -------------------------
    // 6. CANCEL PENDING ORDER (NEW)
    // -------------------------
    @Post(':id/cancel')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Cancel pending order',
        description: 'Cancel order in pending_payment status',
    })
    @ApiResponse({
        status: 200,
        description: 'Order cancelled successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Cannot cancel order in current status',
    })
    async cancelPendingOrder(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: { sessionId?: string; reason?: string },
        @Req() req: { user?: RequestUserPayload },
    ) {
        await this.orderPaymentService.cancelPendingOrder(
            id,
            body.sessionId,
            body.reason,
        );

        return {
            success: true,
            message: 'Order cancelled successfully',
            data: {
                id,
                status: 'cancelled',
                cancelledAt: new Date(),
            },
        };
    }
}
