import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './create-permission.dto';

/**
 * DTO cập nhật Permission
 *
 * Tất cả các field đều optional (có thể cập nhật một phần).
 * PartialType tự động làm tất cả field trong CreatePermissionDto thành optional.
 */
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
