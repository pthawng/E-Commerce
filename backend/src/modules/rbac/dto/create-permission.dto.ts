import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Enum cho module của permission
 * Giúp phân loại permission theo module trong hệ thống
 */
export enum PermissionModule {
  USER = 'user',
  PRODUCT = 'product',
  ORDER = 'order',
  CATEGORY = 'category',
  RBAC = 'rbac',
  ABAC = 'abac',
  SETTING = 'setting',
}

/**
 * Enum cho action của permission
 * Giúp phân loại permission theo hành động
 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Full quyền quản lý (CRUD + các hành động đặc biệt)
}

/**
 * DTO tạo mới Permission
 *
 * - slug: URL-friendly identifier (bắt buộc, unique)
 *   Format: "module.action" hoặc "module.resource.action"
 *   Ví dụ: "user.create", "product.manage", "rbac.role.update"
 * - name: Tên hiển thị của permission (bắt buộc)
 *   Ví dụ: "Tạo người dùng", "Quản lý sản phẩm"
 * - description: Mô tả permission (tùy chọn)
 * - module: Module mà permission thuộc về (tùy chọn)
 * - action: Hành động của permission (tùy chọn)
 */
export class CreatePermissionDto {
  @ApiProperty({
    description: 'Slug của permission (URL-friendly, unique)',
    example: 'user.create',
    pattern: '^[a-z0-9]+(?:\\.[a-z0-9]+)*(?:-[a-z0-9]+)*$',
  })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString({ message: 'Slug phải là chuỗi' })
  @Matches(/^[a-z0-9]+(?:\.[a-z0-9]+)*(?:-[a-z0-9]+)*$/, {
    message: 'Slug chỉ được chứa chữ thường, số, dấu chấm và dấu gạch ngang',
  })
  @MaxLength(100, { message: 'Slug không được quá 100 ký tự' })
  slug: string;

  @ApiProperty({
    description: 'Tên hiển thị của permission',
    example: 'Tạo người dùng',
  })
  @IsNotEmpty({ message: 'Tên permission không được để trống' })
  @IsString({ message: 'Tên permission phải là chuỗi' })
  @MaxLength(100, { message: 'Tên permission không được quá 100 ký tự' })
  name: string;

  @ApiPropertyOptional({
    description: 'Mô tả permission',
    example: 'Cho phép tạo mới người dùng trong hệ thống',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MaxLength(500, { message: 'Mô tả không được quá 500 ký tự' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Module mà permission thuộc về',
    enum: PermissionModule,
    example: PermissionModule.USER,
  })
  @IsOptional()
  @IsEnum(PermissionModule, { message: 'Module không hợp lệ' })
  module?: PermissionModule;

  @ApiPropertyOptional({
    description: 'Hành động của permission',
    enum: PermissionAction,
    example: PermissionAction.CREATE,
  })
  @IsOptional()
  @IsEnum(PermissionAction, { message: 'Action không hợp lệ' })
  action?: PermissionAction;
}
