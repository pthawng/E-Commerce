import { AttributeModule } from '@modules/attribute/attribute.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { CartModule } from '@modules/cart/cart.module';
import { CategoryModule } from '@modules/category/category.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { MailModule } from '@modules/mail/mail.module';
import { OrderModule } from '@modules/order/order.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { ProductModule } from '@modules/product/product.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { SecurityModule } from '@modules/security/security.module';
import { StorageModule } from '@modules/storage/storage.module';
import { UserModule } from '@modules/user/user.module';
import { FeatureFlagModule } from '@modules/infra/feature-flag/feature-flag.module';
import { HealthModule } from '@modules/infra/health/health.module';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { CsrfGuard } from './common/guards/csrf.guard';
import { SessionBindingGuard } from './common/guards/session-binding.guard';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { SessionMiddleware } from './common/middleware/session.middleware';
import { AppConfigModule } from './config/app-config.module';
import { bullConfigFactory, cacheConfigFactory } from './config/redis.config';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    ScheduleModule.forRoot(),
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
          limit: 5,
        },
        {
          name: 'standard',
          ttl: 60000,
          limit: 30,
        },
        {
          name: 'fast',
          ttl: 60000,
          limit: 100,
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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: bullConfigFactory,
      inject: [ConfigService],
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
      useClass: ThrottlerGuard,
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
    consumer.apply(SecurityMiddleware, SessionMiddleware).forRoutes('*');
  }
}
