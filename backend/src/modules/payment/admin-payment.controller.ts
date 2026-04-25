import { AuditLogInterceptor } from '@common/interceptors/audit-log.interceptor';
import { AdminJwtAccessGuard } from '@modules/auth/guard/admin-access-jwt.guard';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { PaymentService } from './payment.service';

/**
 * Admin Payment Controller
 *
 * This controller handles administrative payment management.
 * Specifically mapped to 'payments' to resolve frontend 404s for transactions.
 */
@ApiTags('Admin Payments')
@Controller('payments')
@UseGuards(AdminJwtAccessGuard, PermissionGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminPaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Get('transactions')
  @ApiOperation({ summary: 'Lấy danh sách giao dịch thanh toán (Admin)' })
  @ApiResponse({ status: 200, description: 'Danh sách giao dịch thành công' })
  @Permission(PERMISSIONS.ORDER.READ)
  async findAllTransactions(@Query() query: TransactionQueryDto) {
    return await this.paymentService.findTransactions(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê tài chính & đối soát' })
  @Permission(PERMISSIONS.ORDER.READ)
  async getStats() {
    return await this.paymentService.getTransactionStats();
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Lấy các bất thường tài chính' })
  @Permission(PERMISSIONS.ORDER.READ)
  async getAnomalies() {
    return await this.paymentService.getTransactionAnomalies();
  }
}
