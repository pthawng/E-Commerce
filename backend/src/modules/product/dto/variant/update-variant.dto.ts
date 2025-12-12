import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateVariantDto } from './create-variant.dto';

/**
 * DTO cập nhật Product Variant
 * - Kế thừa CreateVariantDto, tất cả trường optional
 * - Cho phép đổi productId nhưng nên hạn chế về mặt nghiệp vụ (giữ field để linh hoạt)
 */
export class UpdateVariantDto extends PartialType(CreateVariantDto) {
  @IsOptional()
  @IsUUID('4', { message: 'productId phải là UUID hợp lệ' })
  productId?: string;
}
