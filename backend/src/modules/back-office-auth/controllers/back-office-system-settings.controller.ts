import { CurrentUserId } from '@common/decorators/get-user.decorator';
import { SkipJwtAuth } from '@common/decorators/skip-jwt-auth.decorator';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UpdateSystemSettingsDto } from '../../system/dto/update-system-settings.dto';
import { SystemSettingService } from '../../system/system-setting.service';
import { BackOfficeAuthGuard } from '../guards/back-office-auth.guard';

@SkipJwtAuth()
@Controller('back-office/system/settings')
@UseGuards(BackOfficeAuthGuard, PermissionGuard)
export class BackOfficeSystemSettingsController {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  @Get('registry')
  @Permission(PERMISSIONS.SYSTEM.SETTING.READ)
  registry() {
    return this.systemSettingService.getRegistry();
  }

  @Get()
  @Permission(PERMISSIONS.SYSTEM.SETTING.READ)
  findAll() {
    return this.systemSettingService.getAllSettings();
  }

  @Patch()
  @Permission(PERMISSIONS.SYSTEM.SETTING.UPDATE)
  update(@Body() dto: UpdateSystemSettingsDto, @CurrentUserId() userId: string) {
    return this.systemSettingService.updateSettings(dto.settings, userId, dto.reason);
  }
}
