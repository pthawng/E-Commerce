import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO tạo mới Product Variant
 * - productId: ID sản phẩm
 * - sku: mã SKU, unique
 * - price: giá bán (bắt buộc)
 * - compareAtPrice/costPrice/weightGram: tuỳ chọn
 * - variantTitle: JSON hoặc string mô tả thuộc tính hiển thị (giữ dạng string/any cho đơn giản)
 * - isDefault: đánh dấu variant mặc định
 * - isActive: trạng thái hoạt động
 * - position: thứ tự sắp xếp
 */
export class CreateVariantDto {
  @ApiProperty({ description: 'Product ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4', { message: 'productId phải là UUID hợp lệ' })
  productId: string;

  @ApiProperty({ description: 'SKU', example: 'SKU-001' })
  @IsString({ message: 'SKU phải là chuỗi' })
  @IsNotEmpty({ message: 'SKU không được để trống' })
  @MaxLength(100, { message: 'SKU không được quá 100 ký tự' })
  sku: string;

  @ApiProperty({ description: 'Giá bán', example: 199000 })
  @IsNumber({}, { message: 'price phải là số' })
  @IsPositive({ message: 'price phải > 0' })
  price: number;

  @ApiPropertyOptional({ description: 'Giá gốc / compare at price', example: 249000 })
  @IsOptional()
  @IsNumber({}, { message: 'compareAtPrice phải là số' })
  @IsPositive({ message: 'compareAtPrice phải > 0' })
  compareAtPrice?: number;

  @ApiPropertyOptional({ description: 'Giá vốn', example: 120000 })
  @IsOptional()
  @IsNumber({}, { message: 'costPrice phải là số' })
  @IsPositive({ message: 'costPrice phải > 0' })
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Khối lượng (gram)', example: 300 })
  @IsOptional()
  @IsNumber({}, { message: 'weightGram phải là số' })
  @Min(0, { message: 'weightGram phải >= 0' })
  weightGram?: number;

  @ApiPropertyOptional({
    description: 'Tiêu đề biến thể (JSON hoặc string mô tả thuộc tính)',
    example: { size: 'M', color: 'Blue' },
  })
  @IsOptional()
  variantTitle?: any;

  @ApiPropertyOptional({ description: 'Có phải variant mặc định không', default: false })
  @IsOptional()
  @IsBoolean({ message: 'isDefault phải là boolean' })
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Đang hoạt động', default: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp', default: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'position phải là số' })
  position?: number;
}
