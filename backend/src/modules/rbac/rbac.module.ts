import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionCacheService } from './cache/permission-cache.service';
import { PermissionGuard } from './guards/rbac.guard';
import { RbacService } from './rbac.service';
import { RbacAdminController } from './rbacAdmin.controller';

@Module({
  imports: [
    PrismaModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: configService.get('REDIS_URL'),
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RbacAdminController],
  providers: [RbacService, PermissionGuard, PermissionCacheService],
  exports: [RbacService, PermissionGuard, PermissionCacheService],
})
export class RbacModule {}
