import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
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

/**
 * Input cho một biến thể khi tạo product (dùng trong cùng transaction)
 * SKU có thể để trống để BE tự sinh.
 */
export class CreateProductVariantInputDto {
  @ApiPropertyOptional({
    description: 'SKU (để trống nếu muốn BE auto-gen)',
    example: 'NHAN-VANG-18K-10',
  })
  @IsOptional()
  @IsString({ message: 'SKU phải là chuỗi' })
  @MaxLength(100, { message: 'SKU không được quá 100 ký tự' })
  sku?: string;

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
    example: { size: '10', color: 'Gold' },
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

  @ApiPropertyOptional({
    description: 'Danh sách attributeValueId gán cho variant',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'attributeValueIds phải là mảng' })
  @IsUUID('4', { each: true, message: 'attributeValueId phải là UUID hợp lệ' })
  attributeValueIds?: string[];

  @ApiPropertyOptional({
    description: 'Danh sách index media gắn vào variant (theo thứ tự mediaUrls hoặc file upload)',
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: 'mediaIndexes phải là mảng' })
  @IsNumber({}, { each: true, message: 'mediaIndex phải là số' })
  mediaIndexes?: number[];
}

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
  @Transform(({ value }) => {
    // Hỗ trợ cả FormData (string hoặc string[]) lẫn JSON thuần
    if (value === undefined || value === null) return value;
    if (Array.isArray(value)) return value;
    return [value];
  })
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

  @ApiPropertyOptional({
    description: 'Danh sách URL ảnh (nếu không upload file trực tiếp)',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'mediaUrls phải là mảng' })
  @IsString({ each: true, message: 'mediaUrl phải là chuỗi' })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Danh sách biến thể (bắt buộc nếu hasVariants = true)',
    type: [CreateProductVariantInputDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantInputDto)
  @IsOptional()
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 variant khi hasVariants = true' })
  variants?: CreateProductVariantInputDto[];

  // Giá cơ sở cho sản phẩm không biến thể: BE sẽ tự tạo 1 variant mặc định từ giá này
  @ApiPropertyOptional({ description: 'Giá cơ sở (dùng khi hasVariants = false)', example: 199000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'basePrice phải là số' })
  @IsPositive({ message: 'basePrice phải > 0' })
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Giá gốc cơ sở', example: 249000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'baseCompareAtPrice phải là số' })
  @IsPositive({ message: 'baseCompareAtPrice phải > 0' })
  baseCompareAtPrice?: number;

  @ApiPropertyOptional({ description: 'Giá vốn cơ sở', example: 120000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'baseCostPrice phải là số' })
  @IsPositive({ message: 'baseCostPrice phải > 0' })
  baseCostPrice?: number;

  @ApiPropertyOptional({
    description: 'Khối lượng (gram) cho sản phẩm không biến thể',
    example: 300,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'baseWeightGram phải là số' })
  @Min(0, { message: 'baseWeightGram phải >= 0' })
  baseWeightGram?: number;

  @ApiPropertyOptional({
    description: 'Tiêu đề hiển thị cho variant mặc định (nếu hasVariants = false)',
    example: { default: 'Default Variant' },
  })
  @IsOptional()
  baseVariantTitle?: any;
}
