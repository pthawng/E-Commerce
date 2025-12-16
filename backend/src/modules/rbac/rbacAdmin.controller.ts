import { CurrentUser } from '@common/decorators/get-user.decorator';
import type { RequestUserPayload } from '@common/types/jwt.types';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
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
 * RBAC Admin Controller
 *
 * Controller này quản lý toàn bộ hệ thống phân quyền:
 * - CRUD Role (vai trò)
 * - CRUD Permission (quyền)
 * - Gán/bỏ role cho user
 * - Gán/bỏ permission cho user hoặc role
 *
 * Bảo vệ:
 * - Tất cả endpoints đều yêu cầu authentication (JwtAccessGuard - đã global)
 * - Yêu cầu permission "rbac.manage" để truy cập (RBAC authorization)
 *
 * Tư duy Senior:
 * - Separation of Concerns: Controller chỉ xử lý HTTP, logic nghiệp vụ ở Service
 * - Security: Luôn kiểm tra quyền trước khi cho phép thao tác
 * - Error Handling: Service throw exceptions, Controller để NestJS tự xử lý
 * - Audit Trail: Lưu assignedBy từ user hiện tại để biết ai gán quyền
 */
@ApiTags('rbac-admin')
@Controller('admin/rbac')
@UseGuards(JwtAccessGuard, PermissionGuard)
@Permission({
  // Chỉ cho phép user có quyền quản lý role HOẶC user
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

  // ==================== ROLE ENDPOINTS ====================

  /**
   * GET /admin/rbac/roles
   * Lấy danh sách tất cả roles
   *
   * Response: Array of roles với thông tin:
   * - rolePermissions: Danh sách permissions của role
   * - _count.userRoles: Số lượng user đang sử dụng role này
   */
  @Get('roles')
  @ApiOperation({ summary: 'Lấy danh sách tất cả roles' })
  @ApiResponse({ status: 200, description: 'Danh sách roles' })
  async getAllRoles() {
    return this.rbacService.findAllRoles();
  }

  /**
   * GET /admin/rbac/roles/:slug
   * Lấy thông tin chi tiết một role theo slug
   *
   * @param slug - Slug của role (ví dụ: "admin", "manager")
   */
  @Get('roles/:slug')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết role theo slug' })
  @ApiResponse({ status: 200, description: 'Thông tin role' })
  @ApiResponse({ status: 404, description: 'Role không tồn tại' })
  async getRoleBySlug(@Param('slug') slug: string) {
    return this.rbacService.findRoleBySlug(slug);
  }

  /**
   * POST /admin/rbac/roles
   * Tạo mới role
   *
   * @param dto - Dữ liệu role mới (slug, name, description, isSystem)
   * @param user - User hiện tại (từ JWT token)
   *
   * Lưu ý:
   * - slug phải unique và theo format URL-friendly
   * - name phải unique
   * - isSystem = true: role hệ thống, không được xóa
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
   * PATCH /admin/rbac/roles/:slug
   * Cập nhật role
   *
   * @param slug - Slug của role cần cập nhật
   * @param dto - Dữ liệu cập nhật (tất cả field optional)
   *
   * Lưu ý:
   * - Không thể cập nhật role hệ thống (isSystem = true)
   * - Không thể đổi slug (phải xóa và tạo mới)
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
   * DELETE /admin/rbac/roles/:slug
   * Xóa role (soft delete)
   *
   * @param slug - Slug của role cần xóa
   *
   * Lưu ý:
   * - Không thể xóa role hệ thống (isSystem = true)
   * - Không thể xóa role đang được sử dụng bởi user nào đó
   * - Soft delete: chỉ đánh dấu deletedAt, không xóa thật
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

  // ==================== PERMISSION ENDPOINTS ====================

  /**
   * GET /admin/rbac/permissions
   * Lấy danh sách tất cả permissions
   *
   * Response: Array of permissions với thông tin:
   * - _count.roles: Số lượng roles đang sử dụng permission này
   * - _count.userPermissions: Số lượng users đang có permission này trực tiếp
   */
  @Get('permissions')
  @ApiOperation({ summary: 'Lấy danh sách tất cả permissions' })
  @ApiResponse({ status: 200, description: 'Danh sách permissions' })
  async getAllPermissions() {
    return this.rbacService.findAllPermissions();
  }

  /**
   * GET /admin/rbac/permissions/:slug
   * Lấy thông tin chi tiết một permission theo slug
   *
   * @param slug - Slug của permission (ví dụ: "user.create", "product.manage")
   */
  @Get('permissions/:slug')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết permission theo slug' })
  @ApiResponse({ status: 200, description: 'Thông tin permission' })
  @ApiResponse({ status: 404, description: 'Permission không tồn tại' })
  async getPermissionBySlug(@Param('slug') slug: string) {
    return this.rbacService.findPermissionBySlug(slug);
  }

  /**
   * POST /admin/rbac/permissions
   * Tạo mới permission
   *
   * @param dto - Dữ liệu permission mới (slug, name, description, module, action)
   *
   * Lưu ý:
   * - slug phải unique và theo format "module.action" hoặc "module.resource.action"
   * - Ví dụ: "user.create", "product.manage", "rbac.role.update"
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
   * PATCH /admin/rbac/permissions/:slug
   * Cập nhật permission
   *
   * @param slug - Slug của permission cần cập nhật
   * @param dto - Dữ liệu cập nhật (tất cả field optional)
   *
   * Lưu ý:
   * - Không thể đổi slug (phải xóa và tạo mới)
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
   * DELETE /admin/rbac/permissions/:slug
   * Xóa permission
   *
   * @param slug - Slug của permission cần xóa
   *
   * Lưu ý:
   * - Không thể xóa permission đang được sử dụng bởi role hoặc user nào đó
   * - Hard delete: xóa hoàn toàn khỏi database
   */
  @Delete('permissions/:slug')
  @ApiOperation({ summary: 'Xóa permission' })
  @ApiResponse({ status: 200, description: 'Permission đã được xóa' })
  @ApiResponse({ status: 403, description: 'Không thể xóa permission đang được sử dụng' })
  @ApiResponse({ status: 404, description: 'Permission không tồn tại' })
  async deletePermission(@Param('slug') slug: string) {
    return this.rbacService.deletePermission(slug);
  }

  // ==================== ASSIGNMENT ENDPOINTS ====================

  /**
   * POST /admin/rbac/users/:userId/roles
   * Gán role cho user
   *
   * @param userId - ID của user
   * @param dto - Dữ liệu gán role (roleSlug)
   * @param user - User hiện tại (để lưu assignedBy)
   *
   * Flow:
   * 1. Kiểm tra user tồn tại và active
   * 2. Kiểm tra role tồn tại
   * 3. Gán role cho user (upsert: nếu đã có thì không làm gì, chưa có thì tạo mới)
   * 4. Lưu assignedBy = user hiện tại (audit trail)
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
    // Validate userId trong body phải khớp với userId trong URL
    if (dto.userId !== userId) {
      throw new Error('userId trong body phải khớp với userId trong URL');
    }

    return this.rbacService.assignRoleToUser(userId, dto.roleSlug, user.userId);
  }

  /**
   * DELETE /admin/rbac/users/:userId/roles/:roleSlug
   * Gỡ role khỏi user
   *
   * @param userId - ID của user
   * @param roleSlug - Slug của role cần gỡ
   */
  @Delete('users/:userId/roles/:roleSlug')
  @ApiOperation({ summary: 'Gỡ role khỏi user' })
  @ApiResponse({ status: 200, description: 'Role đã được gỡ khỏi user' })
  @ApiResponse({ status: 404, description: 'User hoặc Role không tồn tại' })
  async removeRoleFromUser(@Param('userId') userId: string, @Param('roleSlug') roleSlug: string) {
    return this.rbacService.removeRoleFromUser(userId, roleSlug);
  }

  /**
   * POST /admin/rbac/users/:userId/permissions
   * Gán permission trực tiếp cho user
   *
   * @param userId - ID của user
   * @param dto - Dữ liệu gán permission (permissionSlug)
   * @param user - User hiện tại (để lưu assignedBy)
   *
   * Lưu ý:
   * - Permission có thể được gán trực tiếp cho user (không qua role)
   * - Hữu ích khi cần gán quyền đặc biệt cho một user cụ thể
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
    // Validate userId trong body phải khớp với userId trong URL
    if (dto.targetId !== userId) {
      throw new Error('targetId trong body phải khớp với userId trong URL');
    }

    return this.rbacService.assignPermissionToUser(userId, dto.permissionSlug, user.userId);
  }

  /**
   * DELETE /admin/rbac/users/:userId/permissions/:permissionSlug
   * Gỡ permission khỏi user
   *
   * @param userId - ID của user
   * @param permissionSlug - Slug của permission cần gỡ
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
   * POST /admin/rbac/roles/:roleSlug/permissions
   * Gán permission cho role
   *
   * @param roleSlug - Slug của role
   * @param dto - Dữ liệu gán permission (permissionSlug)
   * @param user - User hiện tại (để lưu assignedBy)
   *
   * Lưu ý:
   * - Tất cả users có role này sẽ tự động có permission này
   * - Cách hiệu quả nhất để phân quyền cho nhiều users cùng lúc
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
   * DELETE /admin/rbac/roles/:roleSlug/permissions/:permissionSlug
   * Gỡ permission khỏi role
   *
   * @param roleSlug - Slug của role
   * @param permissionSlug - Slug của permission cần gỡ
   *
   * Lưu ý:
   * - Tất cả users có role này sẽ mất permission này (trừ khi có permission trực tiếp)
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
