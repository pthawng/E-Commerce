import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

/**
 * Create Product DTO
 *
 * DTO này dùng để tạo mới sản phẩm.
 * - name: Object đa ngôn ngữ (ví dụ: { vi: "Tên sản phẩm", en: "Product Name" })
 * - slug: URL-friendly string (có thể để trống, sẽ tự generate từ name)
 * - description: Object đa ngôn ngữ (tùy chọn)
 * - categoryIds: Mảng ID các danh mục sản phẩm thuộc về
 * - hasVariants: Sản phẩm có biến thể không (mặc định: true)
 * - isActive: Sản phẩm có đang hoạt động không (mặc định: true)
 * - isFeatured: Sản phẩm có nổi bật không (mặc định: false)
 */
export class CreateProductDto {
  @ApiProperty({
    description: 'Tên sản phẩm (đa ngôn ngữ - JSON object)',
    example: { vi: 'Áo thun nam', en: 'Men T-Shirt' },
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsObject({ message: 'Tên sản phẩm phải là object (đa ngôn ngữ)' })
  name: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Slug URL (nếu không có sẽ tự generate từ name)',
    example: 'ao-thun-nam',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsOptional()
  @IsString({ message: 'Slug phải là chuỗi' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Mô tả sản phẩm (đa ngôn ngữ - JSON object)',
    example: { vi: 'Mô tả sản phẩm', en: 'Product description' },
  })
  @Transform(({ value }) => {
    // Nếu là string (từ FormData), parse JSON
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsOptional()
  @IsObject({ message: 'Mô tả phải là object (đa ngôn ngữ)' })
  description?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Danh sách ID các danh mục sản phẩm thuộc về',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Danh sách danh mục phải là mảng' })
  @IsUUID('4', { each: true, message: 'Mỗi categoryId phải là UUID hợp lệ' })
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Sản phẩm có biến thể không (mặc định: true)',
    example: true,
    default: true,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value;
  })
  @IsOptional()
  @IsBoolean({ message: 'hasVariants phải là boolean' })
  hasVariants?: boolean;

  @ApiPropertyOptional({
    description: 'Sản phẩm có đang hoạt động không (mặc định: true)',
    example: true,
    default: true,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value;
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sản phẩm có nổi bật không (mặc định: false)',
    example: false,
    default: false,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value;
  })
  @IsOptional()
  @IsBoolean({ message: 'isFeatured phải là boolean' })
  isFeatured?: boolean;
}
