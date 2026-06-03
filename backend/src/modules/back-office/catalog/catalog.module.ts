import { BackOfficeAuthModule } from '@modules/back-office-auth/back-office-auth.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CatalogController } from './catalog.controller';
import { CatalogRepository } from './catalog.repository';
import { CatalogService } from './catalog.service';

@Module({
  imports: [PrismaModule, BackOfficeAuthModule, RbacModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogRepository],
  exports: [CatalogService],
})
export class CatalogModule {}
