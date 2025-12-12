import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsObject, IsOptional, Min } from 'class-validator';

/**
 * DTO upload media cho product
 *
 * - altText: Mô tả ảnh (đa ngôn ngữ, tùy chọn)
 *   Ví dụ: { vi: "Ảnh sản phẩm", en: "Product image" }
 * - isThumbnail: Đánh dấu ảnh này là thumbnail (mặc định: false)
 * - order: Thứ tự hiển thị (mặc định: 0, số càng nhỏ hiển thị trước)
 */
export class UploadMediaDto {
  @ApiPropertyOptional({
    description: 'Mô tả ảnh (đa ngôn ngữ - JSON object)',
    example: { vi: 'Ảnh sản phẩm', en: 'Product image' },
  })
  @IsOptional()
  @IsObject({ message: 'altText phải là object (đa ngôn ngữ)' })
  altText?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Đánh dấu ảnh này là thumbnail',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isThumbnail phải là boolean' })
  isThumbnail?: boolean;

  @ApiPropertyOptional({
    description: 'Thứ tự hiển thị (số càng nhỏ hiển thị trước)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'order phải là số nguyên' })
  @Min(0, { message: 'order phải >= 0' })
  order?: number;
}
