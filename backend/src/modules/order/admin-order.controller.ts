import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
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
import { PrincipalType } from '../../common/types/principal.types';

@ApiTags('Admin Order')
@Controller('admin/orders')
@UseGuards(PermissionGuard)
@ApiBearerAuth()
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) { }

  @Get()
  @Permission(PERMISSIONS.ORDER.READ)
  @ApiOperation({ summary: 'Lấy tất cả đơn hàng (Admin)' })
  findAll(@Query() dto: PaginationDto & { status?: string }) {
    return this.orderService.findAllPaginated(dto);
  }

  @Get(':id')
  @Permission(PERMISSIONS.ORDER.READ)
  @ApiOperation({ summary: 'Chi tiết đơn hàng (Admin)' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: RequestUserPayload,
  ) {
    return this.orderService.getOrder(id, {
      id: user.userId,
      type: PrincipalType.USER,
    });
  }

  @Patch(':id')
  @Permission(PERMISSIONS.ORDER.UPDATE)
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { status: string; note?: string },
    @CurrentUser() user: RequestUserPayload,
  ) {
    return this.orderService.updateStatus(id, body.status, user.userId, body.note);
  }

  @Post(':id/actions/cancel')
  @Permission(PERMISSIONS.ORDER.UPDATE)
  @ApiOperation({ summary: 'Hủy đơn hàng và hoàn kho' })
  cancelOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: RequestUserPayload,
  ) {
    return this.orderService.updateStatus(id, 'cancelled', user.userId, body.reason);
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

  // Future: @Post(':id/actions/refund')
}
