import { DashboardService } from '@modules/dashboard/dashboard.service';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SkipJwtAuth } from 'src/common/decorators/skip-jwt-auth.decorator';
import { BackOfficeAuthGuard } from '../back-office-auth/guards/back-office-auth.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { PermissionGuard } from '../rbac/guards/rbac.guard';
import { PERMISSIONS } from '../rbac/permissions.constants';

@SkipJwtAuth()
@Controller('back-office/dashboard')
@UseGuards(BackOfficeAuthGuard, PermissionGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Permission(PERMISSIONS.DASHBOARD.VIEW)
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('revenue')
  @Permission(PERMISSIONS.DASHBOARD.VIEW)
  async getRevenue(@Query('range') range: string = '7d') {
    return this.dashboardService.getRevenue(range);
  }

  @Get('top-products')
  @Permission(PERMISSIONS.DASHBOARD.VIEW)
  async getTopProducts(@Query('limit') limit: number = 5) {
    return this.dashboardService.getTopProducts(Number(limit));
  }

  @Get('recent-orders')
  @Permission(PERMISSIONS.DASHBOARD.VIEW)
  async getRecentOrders(@Query('limit') limit: number = 10) {
    return this.dashboardService.getRecentOrders(Number(limit));
  }

  @Get('low-stock')
  @Permission(PERMISSIONS.DASHBOARD.VIEW)
  async getLowStockAlerts(@Query('limit') limit: number = 10) {
    return this.dashboardService.getLowStockAlerts(Number(limit));
  }
}
