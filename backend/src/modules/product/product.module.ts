import { RbacModule } from '@modules/rbac/rbac.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PaginationModule } from 'src/common/pagination';
import { AbacModule } from 'src/modules/abac/abac.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminProductController } from './admin-product.controller';
import { ProductAnomalyListener } from './listeners/product-anomaly.listener';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductStorageModule } from './product.storage/product-storage.module';
import { VariantController } from './variants/variant.controller';
import { VariantPolicy } from './variants/variant.policy';
import { VariantService } from './variants/variant.service';

@Module({
  imports: [
    PrismaModule,
    PaginationModule,
    AbacModule,
    ProductStorageModule,
    RbacModule,
    EventEmitterModule,
    CacheModule.register(),
  ],
  controllers: [ProductController, AdminProductController, VariantController],
  providers: [ProductService, VariantService, VariantPolicy, ProductAnomalyListener],
  exports: [ProductService, VariantService],
})
export class ProductModule {}
