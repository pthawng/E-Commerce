import { CurrentUserId } from '@common/decorators/get-user.decorator';
import { AdminJwtAccessGuard } from '@modules/auth/guard/admin-access-jwt.guard';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { SystemSettingService } from './system-setting.service';

@ApiTags('admin-system-settings')
@Controller('admin/system/settings')
@UseGuards(AdminJwtAccessGuard, PermissionGuard)
export class SystemSettingController {
  constructor(private readonly systemSettingService: SystemSettingService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả cấu hình hệ thống' })
  @ApiResponse({ status: 200, description: 'Cấu hình hiện tại' })
  @Permission(PERMISSIONS.SYSTEM.SETTING.READ)
  findAll() {
    return this.systemSettingService.getAllSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật hàng loạt cấu hình hệ thống' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @Permission(PERMISSIONS.SYSTEM.SETTING.UPDATE)
  update(@Body() dto: UpdateSystemSettingsDto, @CurrentUserId() userId: string) {
    return this.systemSettingService.updateSettings(dto.settings, userId);
  }
}
