import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadMediaDto } from './dto/upload-media.dto';
import { ProductStorageService } from './product-storage.service';
import { Public } from '@common/decorators/public.decorator';

/**
 * Product Storage Controller
 *
 * Controller quản lý media (ảnh) của product:
 * - Upload ảnh cho product
 * - Xóa ảnh của product
 * - Set thumbnail cho product
 * - Sắp xếp lại thứ tự ảnh
 *
 * Routes:
 * - POST /products/:id/media - Upload ảnh
 * - DELETE /products/:id/media/:mediaId - Xóa ảnh
 * - PATCH /products/:id/media/:mediaId/thumbnail - Set thumbnail
 */
@ApiTags('products')
@Controller('products')
export class ProductStorageController {
  constructor(private readonly productStorageService: ProductStorageService) {}

  /**
   * POST /products/:id/media
   * Upload ảnh cho product
   *
   * @param id - ID của product
   * @param file - File ảnh (multipart/form-data)
   * @param dto - DTO chứa altText, isThumbnail, order
   *
   * Lưu ý:
   * - Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)
   * - Kích thước tối đa: 5MB
   * - Nếu set isThumbnail = true, sẽ tự động unset các thumbnail khác
   * - Nếu không set order, sẽ tự động đặt ở cuối danh sách
   */
  @Public()
  @Post(':id/media')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload ảnh cho product' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Media đã được upload' })
  @ApiResponse({ status: 400, description: 'File không hợp lệ hoặc quá lớn' })
  @ApiResponse({ status: 404, description: 'Product không tồn tại' })
  async uploadMedia(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    return this.productStorageService.uploadMedia(id, file, dto);
  }

  /**
   * DELETE /products/:id/media/:mediaId
   * Xóa media của product
   *
   * @param id - ID của product
   * @param mediaId - ID của media cần xóa
   *
   * Lưu ý:
   * - Sẽ xóa cả file trên storage và record trong database
   * - Nếu file không tồn tại trên storage, vẫn xóa record trong DB
   */
  @Delete(':id/media/:mediaId')
  @ApiOperation({ summary: 'Xóa media của product' })
  @ApiResponse({ status: 200, description: 'Media đã được xóa' })
  @ApiResponse({ status: 404, description: 'Product hoặc Media không tồn tại' })
  async deleteMedia(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('mediaId', new ParseUUIDPipe()) mediaId: string,
  ) {
    return this.productStorageService.deleteMedia(id, mediaId);
  }

  /**
   * PATCH /products/:id/media/:mediaId/thumbnail
   * Set media làm thumbnail cho product
   *
   * @param id - ID của product
   * @param mediaId - ID của media cần set làm thumbnail
   *
   * Lưu ý:
   * - Sẽ tự động unset tất cả thumbnail khác của product
   * - Chỉ một media có thể là thumbnail tại một thời điểm
   */
  @Patch(':id/media/:mediaId/thumbnail')
  @ApiOperation({ summary: 'Set media làm thumbnail cho product' })
  @ApiResponse({ status: 200, description: 'Media đã được set làm thumbnail' })
  @ApiResponse({ status: 404, description: 'Product hoặc Media không tồn tại' })
  async setThumbnail(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('mediaId', new ParseUUIDPipe()) mediaId: string,
  ) {
    return this.productStorageService.setThumbnail(id, mediaId);
  }
}
