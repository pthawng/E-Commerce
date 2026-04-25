import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { AttributeModule } from '@modules/attribute/attribute.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { CartModule } from '@modules/cart/cart.module';
import { CategoryModule } from '@modules/category/category.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { DomainEventsModule } from '@modules/infra/events/domain-events.module';
import { FeatureFlagModule } from '@modules/infra/feature-flag/feature-flag.module';
import { HealthModule } from '@modules/infra/health/health.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { MailModule } from '@modules/mail/mail.module';
import { OrderModule } from '@modules/order/order.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { ProductModule } from '@modules/product/product.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { SecurityModule } from '@modules/security/security.module';
import { StorageModule } from '@modules/storage/storage.module';
import { UserModule } from '@modules/user/user.module';
import { SystemModule } from '@modules/system/system.module';
import { ProfileModule } from '@modules/profile/profile.module';
import { LedgerModule } from '@modules/ledger/ledger.module';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { CsrfGuard } from './common/guards/csrf.guard';
import { GlobalThrottlerGuard } from './common/guards/global-throttler.guard';
import { SessionBindingGuard } from './common/guards/session-binding.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { BullBoardAuthMiddleware } from './common/middleware/bull-board-auth.middleware';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { SessionMiddleware } from './common/middleware/session.middleware';
import { AppConfigModule } from './config/app-config.module';
import { bullConfigFactory, cacheConfigFactory } from './config/redis.config';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    JwtModule.register({}),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrometheusModule.register({
      path: '/metrics',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'strict',
          ttl: 60000,
          limit: 30,
        },
        {
          name: 'standard',
          ttl: 60000,
          limit: 100,
        },
        {
          name: 'fast',
          ttl: 60000,
          limit: 300,
        },
      ],
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    MailModule,
    RbacModule,
    SecurityModule,
    StorageModule,
    ProductModule,
    CategoryModule,
    AttributeModule,
    CartModule,
    OrderModule,
    PaymentModule,
    InventoryModule,
    FeatureFlagModule,
    HealthModule,
    DashboardModule,
    DomainEventsModule,
    SystemModule,
    ProfileModule,
    LedgerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: bullConfigFactory,
      inject: [ConfigService],
    }),
    BullBoardModule.forRoot({
      route: '/api/admin/queues',
      adapter: ExpressAdapter,
      boardOptions: {
        uiConfig: {
          boardTitle: 'Ray Paradis Backoffice Ops',
        },
      },
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: cacheConfigFactory,
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GlobalThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SessionBindingGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 🛡️ Admin UI protection
    consumer
      .apply(BullBoardAuthMiddleware)
      .forRoutes('admin/queues', 'admin/queues/*path');

    // 🛡️ Bọc toàn bộ ứng dụng bằng Security & Session Middleware 
    consumer
      .apply(SecurityMiddleware, SessionMiddleware)
      .forRoutes('*');
  }
}
