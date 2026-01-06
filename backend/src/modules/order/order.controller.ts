import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentSession } from 'src/common/decorators/current-session.decorator';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt.guard';
import { RequestUserPayload } from 'src/common/types/jwt.types';
import { JwtAccessGuard } from 'src/modules/auth/guard/access-jwt.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

@ApiTags('Order')
@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

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
}
