import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO gán role cho user
 *
 * - roleSlug: Slug của role cần gán
 * 
 * Note: userId lấy từ URL params, không cần trong body
 */
export class AssignRoleDto {
  @ApiProperty({
    description: 'Slug của role',
    example: 'admin',
  })
  @IsNotEmpty({ message: 'roleSlug không được để trống' })
  @IsString({ message: 'roleSlug phải là chuỗi' })
  roleSlug: string;
}
