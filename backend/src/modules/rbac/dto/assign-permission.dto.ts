import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * DTO gán permission cho user hoặc role
 *
 * - targetId: ID của user hoặc role (tùy context)
 * - permissionSlug: Slug của permission cần gán
 */
export class AssignPermissionDto {
  @ApiProperty({
    description: 'ID của user hoặc role',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'targetId không được để trống' })
  @IsUUID('4', { message: 'targetId phải là UUID hợp lệ' })
  targetId: string;

  @ApiProperty({
    description: 'Slug của permission',
    example: 'user.create',
  })
  @IsNotEmpty({ message: 'permissionSlug không được để trống' })
  @IsString({ message: 'permissionSlug phải là chuỗi' })
  permissionSlug: string;
}
