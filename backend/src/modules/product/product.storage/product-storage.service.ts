import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { StoragePath } from 'src/modules/storage/storage-path.helper';
import { StorageService } from 'src/modules/storage/storage.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadMediaDto } from './dto/upload-media.dto';

/**
 * Product media storage service.
 * Manages product images, uploads, thumbnail selection, and reordering.
 */
@Injectable()
export class ProductStorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Uploads media for a product.
   */
  async uploadMedia(
    productId: string,
    file: Express.Multer.File,
    dto: UploadMediaDto,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    // Check if product exists
    const product = await client.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate that file type is an image
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ cho phép upload file ảnh (JPEG, PNG, WebP, GIF)');
    }

    // Validate file size does not exceed limit
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file không được vượt quá 5MB');
    }

    // Create unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload to storage
    const storagePath = StoragePath.productImage(productId, filename);
    const url = await this.storageService.upload(storagePath, file);

    // If setting as thumbnail, unset other product thumbnails
    if (dto.isThumbnail) {
      await client.productMedia.updateMany({
        where: { productId, isThumbnail: true },
        data: { isThumbnail: false },
      });
    }

    // Get next order value
    let order = dto.order ?? 0;
    if (dto.order === undefined) {
      const maxOrder = await client.productMedia.findFirst({
        where: { productId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = maxOrder ? maxOrder.order + 1 : 0;
    }

    // Save media metadata to database
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
   * Deletes a specific media item.
   */
  async deleteMedia(productId: string, mediaId: string) {
    // Verify media exists and belongs to the product
    const media = await this.prisma.productMedia.findFirst({
      where: { id: mediaId, productId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Delete file from storage
    try {
      const urlParts = media.url.split('/');
      const pathIndex = urlParts.findIndex((part) => part === 'products');
      if (pathIndex !== -1) {
        const storagePath = urlParts.slice(pathIndex).join('/');
        await this.storageService.delete(storagePath);
      }
    } catch (error) {
      // Proceed with database deletion even if storage deletion fails
      console.error('Error deleting file from storage:', error);
    }

    // Delete media metadata from database
    return this.prisma.productMedia.delete({
      where: { id: mediaId },
    });
  }

  /**
   * Sets a specific media item as the product's thumbnail.
   */
  async setThumbnail(productId: string, mediaId: string) {
    // Verify media exists and belongs to the product
    const media = await this.prisma.productMedia.findFirst({
      where: { id: mediaId, productId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Unset all other thumbnails
    await this.prisma.productMedia.updateMany({
      where: { productId, isThumbnail: true },
      data: { isThumbnail: false },
    });

    // Set selected media as thumbnail
    return this.prisma.productMedia.update({
      where: { id: mediaId },
      data: { isThumbnail: true },
    });
  }

  /**
   * Reorders the positions of media items for a product.
   */
  async reorderMedia(productId: string, mediaOrders: Array<{ mediaId: string; order: number }>) {
    // Verify all media IDs belong to the product
    const mediaIds = mediaOrders.map((mo) => mo.mediaId);
    const mediaCount = await this.prisma.productMedia.count({
      where: { id: { in: mediaIds }, productId },
    });

    if (mediaCount !== mediaIds.length) {
      throw new BadRequestException('Một hoặc nhiều media không thuộc về product này');
    }

    // Update position order for each media item
    const updates = mediaOrders.map(({ mediaId, order }) =>
      this.prisma.productMedia.update({
        where: { id: mediaId },
        data: { order },
      }),
    );

    await Promise.all(updates);

    // Return updated list of ordered media
    return this.prisma.productMedia.findMany({
      where: { productId, id: { in: mediaIds } },
      orderBy: { order: 'asc' },
    });
  }
}
