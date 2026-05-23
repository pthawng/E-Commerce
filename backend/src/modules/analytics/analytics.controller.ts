import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Query('range') range: string) {
    return this.analyticsService.getExecutiveOverview(range);
  }

  @Get('customer-intelligence')
  async getCustomerIntelligence() {
    return this.analyticsService.getCustomerIntelligence();
  }

  @Get('product-performance')
  async getProductPerformance(@Query('limit') limit: number) {
    return this.analyticsService.getProductPerformance(limit);
  }

  @Get('operations-pulse')
  async getOperationsPulse() {
    return this.analyticsService.getOperationsPulse();
  }
}
