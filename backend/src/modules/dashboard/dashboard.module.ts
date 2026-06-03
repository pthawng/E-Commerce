import { DashboardController } from '@modules/dashboard/dashboard.controller';
import { DashboardService } from '@modules/dashboard/dashboard.service';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BackOfficeAuthModule } from '../back-office-auth/back-office-auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { SystemModule } from '../system/system.module';
import { DashboardEventProcessor } from './dashboard.processor';

@Module({
  imports: [
    PrismaModule,
    BackOfficeAuthModule,
    SystemModule,
    CacheModule.register(),
    RbacModule, // Required for PermissionGuard
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardEventProcessor],
})
export class DashboardModule {}
