import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionGuard } from './guards/rbac.guard';
import { RbacService } from './rbac.service';
import { RbacAdminController } from './rbacAdmin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RbacAdminController],
  providers: [RbacService, PermissionGuard],
  exports: [RbacService, PermissionGuard],
})
export class RbacModule {}
