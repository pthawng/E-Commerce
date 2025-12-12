import { Module } from '@nestjs/common';
import { PaginationModule } from 'src/common/pagination';
import { AbacModule } from 'src/modules/abac/abac.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductStorageModule } from './product.storage/product-storage.module';
import { VariantController } from './variants/variant.controller';
import { VariantPolicy } from './variants/variant.policy';
import { VariantService } from './variants/variant.service';

@Module({
  imports: [PrismaModule, PaginationModule, AbacModule, ProductStorageModule],
  controllers: [ProductController, VariantController],
  providers: [ProductService, VariantService, VariantPolicy],
  exports: [ProductService, VariantService],
})
export class ProductModule {}
