import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from 'src/generated/prisma/client';
import { StoragePath } from 'src/modules/storage/storage-path.helper';
import { StorageService } from 'src/modules/storage/storage.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadMediaDto } from './dto/upload-media.dto';

/**
 * Product Storage Service
 *
 * Service quản lý media (ảnh) của product:
 * - Upload ảnh lên storage và lưu metadata vào database
 * - Xóa ảnh từ storage và database
 * - Set thumbnail cho product
 * - Sắp xếp lại thứ tự ảnh
 */
@Injectable()
export class ProductStorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload media cho product
   *
   * @param productId - ID của product
   * @param file - File ảnh từ multer
   * @param dto - DTO chứa altText, isThumbnail, order
   * @returns ProductMedia đã được tạo
   */
  async uploadMedia(
    productId: string,
    file: Express.Multer.File,
    dto: UploadMediaDto,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    // 1. Kiểm tra product tồn tại
    const product = await client.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Validate file type (chỉ cho phép ảnh)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ cho phép upload file ảnh (JPEG, PNG, WebP, GIF)');
    }

    // 3. Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file không được vượt quá 5MB');
    }

    // 4. Tạo filename unique
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 5. Upload lên storage
    const storagePath = StoragePath.productImage(productId, filename);
    const url = await this.storageService.upload(storagePath, file);

    // 6. Nếu set làm thumbnail, unset các thumbnail khác
    if (dto.isThumbnail) {
      await client.productMedia.updateMany({
        where: { productId, isThumbnail: true },
        data: { isThumbnail: false },
      });
    }

    // 7. Lấy order mặc định (max order + 1)
    let order = dto.order ?? 0;
    if (dto.order === undefined) {
      const maxOrder = await client.productMedia.findFirst({
        where: { productId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = maxOrder ? maxOrder.order + 1 : 0;
    }

    // 8. Lưu vào database
    return client.productMedia.create({
      data: {
        productId,
        url,
        type: 'image',
        altText: dto.altText ? (dto.altText as Prisma.InputJsonValue) : undefined,
        isThumbnail: dto.isThumbnail ?? false,
        order,
      },
    });
  }

  /**
   * Xóa media
   *
   * @param productId - ID của product
   * @param mediaId - ID của media cần xóa
   */
  async deleteMedia(productId: string, mediaId: string) {
    // 1. Kiểm tra media tồn tại và thuộc về product
    const media = await this.prisma.productMedia.findFirst({
      where: { id: mediaId, productId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // 2. Xóa file trên storage
    // Extract path từ URL (hoặc lưu path riêng trong DB)
    // Tạm thời dùng URL để extract path
    try {
      const urlParts = media.url.split('/');
      const pathIndex = urlParts.findIndex((part) => part === 'products');
      if (pathIndex !== -1) {
        const storagePath = urlParts.slice(pathIndex).join('/');
        await this.storageService.delete(storagePath);
      }
    } catch (error) {
      // Log error nhưng vẫn tiếp tục xóa record trong DB
      console.error('Error deleting file from storage:', error);
    }

    // 3. Xóa record trong database
    return this.prisma.productMedia.delete({
      where: { id: mediaId },
    });
  }

  /**
   * Set thumbnail cho product
   *
   * @param productId - ID của product
   * @param mediaId - ID của media cần set làm thumbnail
   */
  async setThumbnail(productId: string, mediaId: string) {
    // 1. Kiểm tra media tồn tại và thuộc về product
    const media = await this.prisma.productMedia.findFirst({
      where: { id: mediaId, productId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // 2. Unset tất cả thumbnail khác
    await this.prisma.productMedia.updateMany({
      where: { productId, isThumbnail: true },
      data: { isThumbnail: false },
    });

    // 3. Set media này làm thumbnail
    return this.prisma.productMedia.update({
      where: { id: mediaId },
      data: { isThumbnail: true },
    });
  }

  /**
   * Sắp xếp lại thứ tự media
   *
   * @param productId - ID của product
   * @param mediaOrders - Array of { mediaId, order }
   */
  async reorderMedia(productId: string, mediaOrders: Array<{ mediaId: string; order: number }>) {
    // Validate tất cả media thuộc về product
    const mediaIds = mediaOrders.map((mo) => mo.mediaId);
    const mediaCount = await this.prisma.productMedia.count({
      where: { id: { in: mediaIds }, productId },
    });

    if (mediaCount !== mediaIds.length) {
      throw new BadRequestException('Một hoặc nhiều media không thuộc về product này');
    }

    // Update order cho từng media
    const updates = mediaOrders.map(({ mediaId, order }) =>
      this.prisma.productMedia.update({
        where: { id: mediaId },
        data: { order },
      }),
    );

    await Promise.all(updates);

    // Trả về danh sách media đã được sắp xếp lại
    return this.prisma.productMedia.findMany({
      where: { productId, id: { in: mediaIds } },
      orderBy: { order: 'asc' },
    });
  }
}
