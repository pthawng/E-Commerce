import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * DTO gán role cho user
 *
 * - userId: ID của user cần gán role
 * - roleSlug: Slug của role cần gán
 */
export class AssignRoleDto {
  @ApiProperty({
    description: 'ID của user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'userId không được để trống' })
  @IsUUID('4', { message: 'userId phải là UUID hợp lệ' })
  userId: string;

  @ApiProperty({
    description: 'Slug của role',
    example: 'admin',
  })
  @IsNotEmpty({ message: 'roleSlug không được để trống' })
  @IsString({ message: 'roleSlug phải là chuỗi' })
  roleSlug: string;
}
