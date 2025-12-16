import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionCacheService } from './cache/permission-cache.service';
import { PermissionGuard } from './guards/rbac.guard';
import { RbacService } from './rbac.service';
import { RbacAdminController } from './rbacAdmin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RbacAdminController],
  providers: [RbacService, PermissionGuard, PermissionCacheService],
  exports: [RbacService, PermissionGuard, PermissionCacheService],
})
export class RbacModule {}
