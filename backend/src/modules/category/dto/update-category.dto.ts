import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

/**
 * DTO cập nhật danh mục.
 * Kế thừa CreateCategoryDto, tất cả trường đều optional.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @IsUUID('4', { message: 'parentId phải là UUID hợp lệ' })
  parentId?: string | null;
}
