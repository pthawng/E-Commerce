import { BackOfficeAuthGuard } from '@modules/back-office-auth/guards/back-office-auth.guard';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipJwtAuth } from 'src/common/decorators/skip-jwt-auth.decorator';
import { VipCareService } from './vip-care.service';

@ApiTags('back-office-vip-care')
@ApiBearerAuth()
@SkipJwtAuth()
@Controller('back-office/vip-care')
@UseGuards(BackOfficeAuthGuard, PermissionGuard)
export class VipCareController {
  constructor(private readonly vipCareService: VipCareService) {}

  @Get('command-center')
  @Permission(PERMISSIONS.CRM.VIP_CARE.READ)
  getCommandCenter() {
    return this.vipCareService.getCommandCenter();
  }

  @Get('clients')
  @Permission(PERMISSIONS.CRM.VIP_CARE.READ)
  listClients(@Query('status') status?: string) {
    return this.vipCareService.listClients(status);
  }

  @Get('clients/:id')
  @Permission(PERMISSIONS.CRM.VIP_CARE.READ)
  getClient(@Param('id') id: string) {
    return this.vipCareService.getClient(id);
  }
}
