/**
 * Delete Product DTO
 *
 * Lưu ý: Trong thực tế, delete operation thường không cần DTO riêng
 * vì chỉ cần ID từ route parameter (ví dụ: DELETE /products/:id)
 *
 * File này được tạo để giữ cấu trúc thống nhất, nhưng có thể không sử dụng.
 * Nếu cần soft delete với lý do (reason), có thể thêm field vào đây.
 *
 * Ví dụ sử dụng trong Controller:
 * @Delete(':id')
 * async remove(@Param('id', new ParseUUIDPipe()) id: string) {
 *   return this.productService.softDelete(id);
 * }
 */

// Nếu cần soft delete với lý do, uncomment phần dưới:

// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { IsOptional, IsString, MaxLength } from 'class-validator';
//
// export class DeleteProductDto {
//   @ApiPropertyOptional({
//     description: 'Lý do xóa sản phẩm (tùy chọn)',
//     example: 'Sản phẩm không còn sản xuất',
//     maxLength: 500,
//   })
//   @IsOptional()
//   @IsString({ message: 'Lý do xóa phải là chuỗi' })
//   @MaxLength(500, { message: 'Lý do xóa không được vượt quá 500 ký tự' })
//   reason?: string;
// }

// Hiện tại không cần DTO này vì delete chỉ cần ID từ route param
export {};
