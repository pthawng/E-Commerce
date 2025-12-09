import { Module } from '@nestjs/common';
import { PaginationModule } from 'src/common/pagination';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductController } from './product.controller';
import { ProductService } from './services/product.service';

@Module({
  imports: [PrismaModule, PaginationModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
