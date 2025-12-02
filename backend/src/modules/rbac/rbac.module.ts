import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionGuard } from './guards/rbac.guard';
import { RbacService } from './rbac.service';

@Module({
  imports: [PrismaModule],
  providers: [RbacService, PermissionGuard],
  exports: [RbacService, PermissionGuard],
})
export class RbacModule {}
