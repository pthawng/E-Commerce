import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

/**
 * DTO tạo mới danh mục.
 * - name: JSON đa ngôn ngữ (bắt buộc)
 * - slug: chuỗi url-friendly, không bắt buộc (tự sinh từ name nếu bỏ trống)
 * - parentId: danh mục cha (tuỳ chọn)
 * - order: thứ tự hiển thị (mặc định 0)
 * - isActive: trạng thái hoạt động (mặc định true)
 */
export class CreateCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục (đa ngôn ngữ - JSON object)',
    example: { vi: 'Điện thoại', en: 'Phones' },
  })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsObject({ message: 'Tên danh mục phải là object (đa ngôn ngữ)' })
  name: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Slug URL (nếu không có sẽ tự generate từ name)',
    example: 'dien-thoai',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsOptional()
  @IsString({ message: 'Slug phải là chuỗi' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'ID danh mục cha (nếu có)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'parentId phải là UUID hợp lệ' })
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'Thứ tự hiển thị (số nguyên, mặc định 0)',
    example: 10,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'order phải là số nguyên' })
  @Min(0, { message: 'order phải >= 0' })
  order?: number;

  @ApiPropertyOptional({
    description: 'Trạng thái hoạt động (mặc định: true)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive?: boolean;
}

