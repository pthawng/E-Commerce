import { PaginationRateLimitGuard } from '@common/guards/pagination-rate-limit.guard';
import { PaginationDto } from '@common/pagination';
import { AdminJwtAccessGuard } from '@modules/auth/guard/admin-access-jwt.guard';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

/**
 * Admin User Controller
 *
 * This controller handles administrative user management (Staff Management).
 * It is mapped to 'admin/rbac/users' to match the frontend expectations.
 */
@ApiTags('admin-users')
@Controller('admin/rbac/users')
@UseGuards(AdminJwtAccessGuard, PermissionGuard)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(PaginationRateLimitGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Lấy danh sách user quản trị (phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách user' })
  @Permission(PERMISSIONS.AUTH.USER.READ)
  findAll(@Query() dto: PaginationDto) {
    return this.userService.findAllUserPaginated(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới user quản trị' })
  @ApiResponse({ status: 201, description: 'Tạo user thành công' })
  @Permission(PERMISSIONS.AUTH.USER.CREATE)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật user quản trị' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @Permission(PERMISSIONS.AUTH.USER.UPDATE)
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa user quản trị (soft delete)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @Permission(PERMISSIONS.AUTH.USER.DELETE)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.softDelete(id);
  }
}
