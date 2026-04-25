import { Public } from '@common/decorators/public.decorator';
import { AdminJwtAccessGuard } from '@modules/auth/guard/admin-access-jwt.guard';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';

const DEFAULT_TARGET_CURRENCIES = ['USD', 'CNY', 'EUR', 'JPY'];

async function resolveRates(currencyService: CurrencyService, targets?: string) {
  const targetList = targets ? targets.split(',') : DEFAULT_TARGET_CURRENCIES;
  const rates: Record<string, number> = {};

  for (const target of targetList) {
    rates[target] = await currencyService.getRate(target);
  }

  return {
    base: 'VND',
    rates,
    timestamp: new Date(),
  };
}

@ApiTags('currency')
@Controller('system/currency')
export class PublicCurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  @Public()
  @ApiOperation({ summary: 'Get public currency rates for storefront display' })
  @ApiResponse({ status: 200, description: 'Currency rates' })
  async getRates(@Query('targetCurrencies') targets?: string) {
    return resolveRates(this.currencyService, targets);
  }
}

@ApiTags('admin-currency')
@Controller('admin/system/currency')
@UseGuards(AdminJwtAccessGuard, PermissionGuard)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get current currency rates' })
  @ApiResponse({ status: 200, description: 'Currency rates' })
  @Permission(PERMISSIONS.SYSTEM.SETTING.READ)
  async getRates(@Query('targetCurrencies') targets?: string) {
    return resolveRates(this.currencyService, targets);
  }
}
