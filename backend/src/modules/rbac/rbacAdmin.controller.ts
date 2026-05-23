import { CurrentUser } from '@common/decorators/get-user.decorator';
import type { RequestUserPayload } from '@common/types/jwt.types';
import { AdminJwtAccessGuard } from '@modules/auth/guard/admin-access-jwt.guard';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permission } from './decorators/permission.decorator';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionGuard } from './guards/rbac.guard';
import { PERMISSIONS } from './permissions.constants';
import { RbacService } from './rbac.service';

/**
 * RBAC Admin Controller.
 * Handles role-based and attribute-based access control management.
 */
@ApiTags('rbac-admin')
@Controller('admin/rbac')
@UseGuards(AdminJwtAccessGuard, PermissionGuard)
@Permission({
  // Verify user has update role, user, or role assignment permission
  permissions: [
    PERMISSIONS.AUTH.ROLE.UPDATE,
    PERMISSIONS.AUTH.USER.UPDATE,
    PERMISSIONS.AUTH.USER.ASSIGN_ROLE,
    PERMISSIONS.AUTH.USER.ASSIGN_PERMISSION,
  ],
  mode: 'any',
})
export class RbacAdminController {
  constructor(private readonly rbacService: RbacService) {}

  /**
   * Retrieves all roles.
   */
  @Get('roles')
  @ApiOperation({ summary: 'Lấy danh sách tất cả roles' })
  @ApiResponse({ status: 200, description: 'Danh sách roles' })
  async getAllRoles() {
    return this.rbacService.findAllRoles();
  }

  /**
   * Retrieves a role by its unique slug.
   */
  @Get('roles/:slug')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết role theo slug' })
  @ApiResponse({ status: 200, description: 'Thông tin role' })
  @ApiResponse({ status: 404, description: 'Role không tồn tại' })
  async getRoleBySlug(@Param('slug') slug: string) {
    return this.rbacService.findRoleBySlug(slug);
  }

  /**
   * Creates a new role.
   */
  @Post('roles')
  @ApiOperation({ summary: 'Tạo mới role' })
  @ApiResponse({ status: 201, description: 'Role đã được tạo' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Role đã tồn tại' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole({
      slug: dto.slug,
      name: dto.name,
      description: dto.description,
      isSystem: dto.isSystem ?? false,
    });
  }

  /**
   * Updates an existing role by its slug.
   */
  @Patch('roles/:slug')
  @ApiOperation({ summary: 'Cập nhật role' })
  @ApiResponse({ status: 200, description: 'Role đã được cập nhật' })
  @ApiResponse({ status: 403, description: 'Không thể cập nhật role hệ thống' })
  @ApiResponse({ status: 404, description: 'Role không tồn tại' })
  async updateRole(@Param('slug') slug: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(slug, {
      name: dto.name,
      description: dto.description,
    });
  }

  /**
   * Soft deletes a role by its slug.
   */
  @Delete('roles/:slug')
  @ApiOperation({ summary: 'Xóa role (soft delete)' })
  @ApiResponse({ status: 200, description: 'Role đã được xóa' })
  @ApiResponse({
    status: 403,
    description: 'Không thể xóa role hệ thống hoặc role đang được sử dụng',
  })
  @ApiResponse({ status: 404, description: 'Role không tồn tại' })
  async deleteRole(@Param('slug') slug: string) {
    return this.rbacService.deleteRole(slug);
  }

  /**
   * Retrieves all permissions.
   */
  @Get('permissions')
  @ApiOperation({ summary: 'Lấy danh sách tất cả permissions' })
  @ApiResponse({ status: 200, description: 'Danh sách permissions' })
  async getAllPermissions() {
    return this.rbacService.findAllPermissions();
  }

  /**
   * Retrieves a permission by its unique slug.
   */
  @Get('permissions/:slug')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết permission theo slug' })
  @ApiResponse({ status: 200, description: 'Thông tin permission' })
  @ApiResponse({ status: 404, description: 'Permission không tồn tại' })
  async getPermissionBySlug(@Param('slug') slug: string) {
    return this.rbacService.findPermissionBySlug(slug);
  }

  /**
   * Creates a new permission.
   */
  @Post('permissions')
  @ApiOperation({ summary: 'Tạo mới permission' })
  @ApiResponse({ status: 201, description: 'Permission đã được tạo' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Permission đã tồn tại' })
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.rbacService.createPermission({
      slug: dto.slug,
      name: dto.name,
      description: dto.description,
      module: dto.module,
      action: dto.action,
    });
  }

  /**
   * Updates an existing permission by its slug.
   */
  @Patch('permissions/:slug')
  @ApiOperation({ summary: 'Cập nhật permission' })
  @ApiResponse({ status: 200, description: 'Permission đã được cập nhật' })
  @ApiResponse({ status: 404, description: 'Permission không tồn tại' })
  async updatePermission(@Param('slug') slug: string, @Body() dto: UpdatePermissionDto) {
    return this.rbacService.updatePermission(slug, {
      name: dto.name,
      description: dto.description,
      module: dto.module,
      action: dto.action,
    });
  }

  /**
   * Deletes a permission by its slug.
   */
  @Delete('permissions/:slug')
  @ApiOperation({ summary: 'Xóa permission' })
  @ApiResponse({ status: 200, description: 'Permission đã được xóa' })
  @ApiResponse({ status: 403, description: 'Không thể xóa permission đang được sử dụng' })
  @ApiResponse({ status: 404, description: 'Permission không tồn tại' })
  async deletePermission(@Param('slug') slug: string) {
    return this.rbacService.deletePermission(slug);
  }

  /**
   * Assigns a role to a user.
   */
  @Post('users/:userId/roles')
  @ApiOperation({ summary: 'Gán role cho user' })
  @ApiResponse({ status: 201, description: 'Role đã được gán cho user' })
  @ApiResponse({ status: 404, description: 'User hoặc Role không tồn tại' })
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: RequestUserPayload,
  ) {
    return this.rbacService.assignRoleToUser(userId, dto.roleSlug, user.userId);
  }

  /**
   * Removes a role from a user.
   */
  @Delete('users/:userId/roles/:roleSlug')
  @ApiOperation({ summary: 'Gỡ role khỏi user' })
  @ApiResponse({ status: 200, description: 'Role đã được gỡ khỏi user' })
  @ApiResponse({ status: 404, description: 'User hoặc Role không tồn tại' })
  async removeRoleFromUser(@Param('userId') userId: string, @Param('roleSlug') roleSlug: string) {
    return this.rbacService.removeRoleFromUser(userId, roleSlug);
  }

  /**
   * Retrieves roles assigned to a user.
   */
  @Get('users/:userId/roles')
  @ApiOperation({ summary: 'Lấy roles của user' })
  @ApiResponse({ status: 200, description: 'Danh sách roles của user' })
  async getUserRoles(@Param('userId') userId: string) {
    return this.rbacService.getUserRoles(userId);
  }

  /**
   * Assigns a permission directly to a user.
   */
  @Post('users/:userId/permissions')
  @ApiOperation({ summary: 'Gán permission trực tiếp cho user' })
  @ApiResponse({ status: 201, description: 'Permission đã được gán cho user' })
  @ApiResponse({ status: 404, description: 'User hoặc Permission không tồn tại' })
  async assignPermissionToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignPermissionDto,
    @CurrentUser() user: RequestUserPayload,
  ) {
    // Validate target ID matches URL parameter
    if (dto.targetId !== userId) {
      throw new Error('targetId trong body phải khớp với userId trong URL');
    }

    return this.rbacService.assignPermissionToUser(userId, dto.permissionSlug, user.userId);
  }

  /**
   * Removes a direct permission assignment from a user.
   */
  @Delete('users/:userId/permissions/:permissionSlug')
  @ApiOperation({ summary: 'Gỡ permission khỏi user' })
  @ApiResponse({ status: 200, description: 'Permission đã được gỡ khỏi user' })
  @ApiResponse({ status: 404, description: 'User hoặc Permission không tồn tại' })
  async removePermissionFromUser(
    @Param('userId') userId: string,
    @Param('permissionSlug') permissionSlug: string,
  ) {
    return this.rbacService.removePermissionFromUser(userId, permissionSlug);
  }

  /**
   * Retrieves direct permission assignments for a user.
   */
  @Get('users/:userId/permissions')
  @ApiOperation({ summary: 'Lấy permissions trực tiếp của user' })
  @ApiResponse({ status: 200, description: 'Danh sách permissions của user' })
  async getUserPermissions(@Param('userId') userId: string) {
    return this.rbacService.getUserPermissionAssignments(userId);
  }

  /**
   * Assigns a permission to a role.
   */
  @Post('roles/:roleSlug/permissions')
  @ApiOperation({ summary: 'Gán permission cho role' })
  @ApiResponse({ status: 201, description: 'Permission đã được gán cho role' })
  @ApiResponse({ status: 404, description: 'Role hoặc Permission không tồn tại' })
  async assignPermissionToRole(
    @Param('roleSlug') roleSlug: string,
    @Body() dto: AssignPermissionDto,
    @CurrentUser() user: RequestUserPayload,
  ) {
    return this.rbacService.assignPermissionToRole(roleSlug, dto.permissionSlug, user.userId);
  }

  /**
   * Removes a permission assignment from a role.
   */
  @Delete('roles/:roleSlug/permissions/:permissionSlug')
  @ApiOperation({ summary: 'Gỡ permission khỏi role' })
  @ApiResponse({ status: 200, description: 'Permission đã được gỡ khỏi role' })
  @ApiResponse({ status: 404, description: 'Role hoặc Permission không tồn tại' })
  async removePermissionFromRole(
    @Param('roleSlug') roleSlug: string,
    @Param('permissionSlug') permissionSlug: string,
  ) {
    return this.rbacService.removePermissionFromRole(roleSlug, permissionSlug);
  }
}
