import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * DTO tạo mới Role
 *
 * - slug: URL-friendly identifier (bắt buộc, unique)
 *   Ví dụ: "admin", "manager", "customer"
 * - name: Tên hiển thị của role (bắt buộc, unique)
 *   Ví dụ: "Administrator", "Quản lý", "Khách hàng"
 * - description: Mô tả role (tùy chọn)
 * - isSystem: Đánh dấu role hệ thống (không được xóa)
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Slug của role (URL-friendly, unique)',
    example: 'admin',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString({ message: 'Slug phải là chuỗi' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
  })
  @MaxLength(50, { message: 'Slug không được quá 50 ký tự' })
  slug: string;

  @ApiProperty({
    description: 'Tên hiển thị của role (unique)',
    example: 'Administrator',
  })
  @IsNotEmpty({ message: 'Tên role không được để trống' })
  @IsString({ message: 'Tên role phải là chuỗi' })
  @MaxLength(100, { message: 'Tên role không được quá 100 ký tự' })
  name: string;

  @ApiPropertyOptional({
    description: 'Mô tả role',
    example: 'Quản trị viên hệ thống với toàn quyền',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MaxLength(500, { message: 'Mô tả không được quá 500 ký tự' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Đánh dấu role hệ thống (không được xóa)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isSystem phải là boolean' })
  isSystem?: boolean;
}
