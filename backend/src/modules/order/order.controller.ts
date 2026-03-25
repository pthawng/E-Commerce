import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentSession } from 'src/common/decorators/current-session.decorator';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt.guard';
import { RequestUserPayload } from 'src/common/types/jwt.types';
import { JwtAccessGuard } from 'src/modules/auth/guard/access-jwt.guard';
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
    // 1. CREATE ORDER (Checkout)
    // -------------------------
    @Post()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Create order with payment integration',
        description: 'Step 2: Creates order, confirms inventory reservation, and initiates payment.' 
    })
    @ApiResponse({ status: 201, type: OrderPaymentResponseDto })
    async createOrder(
        @Body() dto: CreateOrderWithPaymentDto,
        @Headers('x-idempotency-key') idempotencyKey: string,
        @Req() req: { user?: RequestUserPayload },
        @CurrentSession() sessionId?: string,
    ): Promise<OrderPaymentResponseDto> {
        // Use idempotency key from header if not in body
        (dto as any).idempotencyKey = (dto as any).idempotencyKey || idempotencyKey;
        
        return this.orderPaymentService.createOrderWithPayment(
            dto,
            req.user?.userId,
            sessionId,
        );
    }

    // -------------------------
    // 2. GET MY ORDERS
    // -------------------------
    @Get()
    @UseGuards(JwtAccessGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách đơn hàng của tôi' })
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
}
