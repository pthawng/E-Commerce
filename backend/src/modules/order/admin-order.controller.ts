import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import { OwnershipRegistry } from '@modules/security/ownership.registry';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/get-user.decorator';
import { PaginationDto } from '../../common/pagination';
import { RequestUserPayload } from '../../common/types/jwt.types';
import { OrderService } from './order.service';

import { OrderStatusEnum } from '@prisma/client';
import { AdminCreateOrderDto } from './dto/admin-create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RefundService } from './services/refund.service';

import { OrderPaymentService } from './services/order-payment.service';

@ApiTags('Admin Order')
@Controller('admin/orders')
@UseGuards(PermissionGuard)
@ApiBearerAuth()
export class AdminOrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly refundService: RefundService,
    private readonly ownershipRegistry: OwnershipRegistry,
    private readonly orderPaymentService: OrderPaymentService,
  ) {}

  @Post()
  @Permission(PERMISSIONS.ORDER.UPDATE)
  @ApiOperation({ summary: 'Tạo đơn hàng mới (Admin)' })
  create(@Body() dto: AdminCreateOrderDto, @CurrentUser() user: RequestUserPayload) {
    return this.orderPaymentService.adminCreateOrder(dto, user.userId);
  }

  @Get('stats')
  @Permission(PERMISSIONS.ORDER.READ)
  @ApiOperation({ summary: 'Lấy thống kê tổng quan đơn hàng (Admin)' })
  getStats() {
    return this.orderService.getSummaryStats();
  }

  @Get()
  @Permission(PERMISSIONS.ORDER.READ)
  @ApiOperation({ summary: 'Lấy tất cả đơn hàng (Admin)' })
  findAll(
    @Query()
    dto: PaginationDto & {
      status?: string;
      customerId?: string;
      guestEmail?: string;
      queue?: string;
    },
  ) {
    return this.orderService.findAllPaginated(dto);
  }

  @Get(':id')
  @Permission(PERMISSIONS.ORDER.READ)
  @ApiOperation({ summary: 'Chi tiết đơn hàng (Admin)' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: RequestUserPayload) {
    const principal = this.ownershipRegistry.createPrincipal(user);
    return this.orderService.getOrder(id, principal);
  }

  @Patch(':id')
  @Permission(PERMISSIONS.ORDER.UPDATE)
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: RequestUserPayload,
  ) {
    return this.orderService.transitionTo(id, dto.status as OrderStatusEnum, user.userId, dto.note);
  }

  @Post(':id/actions/cancel')
  @Permission(PERMISSIONS.ORDER.UPDATE)
  @ApiOperation({ summary: 'Hủy đơn hàng và hoàn kho' })
  cancelOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: RequestUserPayload,
  ) {
    return this.orderPaymentService.cancelOrder(id, dto.reason, user.userId);
  }

  @Post(':id/actions/refund')
  @Permission(PERMISSIONS.ORDER.REFUND)
  @ApiOperation({ summary: 'Hoàn tiền cho đơn hàng' })
  async refundOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { amount: number; reason: string },
    @CurrentUser() user: RequestUserPayload,
  ) {
    return this.refundService.processRefund(id, body.amount, body.reason, user.userId);
  }

  @Patch(':id/tracking')
  @Permission(PERMISSIONS.ORDER.SHIPMENT_MANAGE)
  @ApiOperation({ summary: 'Cập nhật thông tin vận chuyển' })
  updateTracking(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { trackingCode: string; estimatedDeliveryAt?: Date },
    @CurrentUser() user: RequestUserPayload,
  ) {
    return this.orderService.updateTracking(
      id,
      body.trackingCode,
      body.estimatedDeliveryAt,
      user.userId,
    );
  }
}
