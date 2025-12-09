import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * Update Product DTO
 *
 * DTO này dùng để cập nhật thông tin sản phẩm.
 * Tất cả các field đều optional (có thể cập nhật một phần).
 *
 * PartialType tự động làm tất cả field trong CreateProductDto thành optional,
 * và giữ nguyên các validation decorators.
 *
 * Ví dụ sử dụng:
 * - Chỉ cập nhật tên: { name: { vi: "Tên mới" } }
 * - Cập nhật nhiều field: { name: {...}, isActive: false, categoryIds: [...] }
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
