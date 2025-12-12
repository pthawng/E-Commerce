import { Module } from '@nestjs/common';
import { StorageModule } from 'src/modules/storage/storage.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductStorageController } from './product-storage.controller';
import { ProductStorageService } from './product-storage.service';

/**
 * Product Storage Module
 *
 * Module quản lý media (ảnh) của product:
 * - Upload ảnh lên storage
 * - Xóa ảnh từ storage
 * - Set thumbnail
 * - Sắp xếp lại thứ tự ảnh
 */
@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ProductStorageController],
  providers: [ProductStorageService],
  exports: [ProductStorageService],
})
export class ProductStorageModule {}
