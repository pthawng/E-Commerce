import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';

/**
 * DTO cập nhật Role
 *
 * Tất cả các field đều optional (có thể cập nhật một phần).
 * PartialType tự động làm tất cả field trong CreateRoleDto thành optional.
 *
 * Lưu ý:
 * - Không thể cập nhật slug của role hệ thống (isSystem = true)
 * - Không thể đổi isSystem từ true sang false
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
