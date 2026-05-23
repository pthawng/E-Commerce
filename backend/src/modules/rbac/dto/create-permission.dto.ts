import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Enum for permission modules.
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
 * Enum for permission actions.
 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Full management permission
}

/**
 * DTO for creating a permission.
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
