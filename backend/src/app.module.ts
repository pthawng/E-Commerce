import { AttributeModule } from '@modules/attribute/attribute.module';
import { AuthModule } from '@modules/auth/auth.module';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { CategoryModule } from '@modules/category/category.module';
import { MailModule } from '@modules/mail/mail.module';
import { ProductModule } from '@modules/product/product.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { StorageModule } from '@modules/storage/storage.module';
import { UserModule } from '@modules/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { redisStore } from 'cache-manager-redis-yet';
import * as Joi from 'joi';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(4000),
        DATABASE_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().default('redis_secure_pass_123'),
        REDIS_TTL: Joi.number().default(60000),
        MAIL_PROVIDER: Joi.string().valid('gmail', 'sendgrid').default('gmail'),
        SENDGRID_API_KEY: Joi.string().when('MAIL_PROVIDER', {
          is: 'sendgrid',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        MAIL_FROM: Joi.string().when('MAIL_PROVIDER', {
          is: 'sendgrid',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        COMPANY_NAME: Joi.string().required(),
        GMAIL_CLIENT_ID: Joi.string().when('MAIL_PROVIDER', {
          is: 'gmail',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        GMAIL_CLIENT_SECRET: Joi.string().when('MAIL_PROVIDER', {
          is: 'gmail',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        GMAIL_REFRESH_TOKEN: Joi.string().when('MAIL_PROVIDER', {
          is: 'gmail',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        GMAIL_USER: Joi.string().when('MAIL_PROVIDER', {
          is: 'gmail',
          then: Joi.required(),
          otherwise: Joi.string().optional(),
        }),
        GMAIL_REDIRECT_URI: Joi.string().optional(),
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        SUPABASE_BUCKET: Joi.string().required(),
      }),
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    MailModule,
    RbacModule,
    StorageModule,
    ProductModule,
    CategoryModule,
    AttributeModule,
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
  controllers: [AppController],
  providers: [
    AppService,
    // Set JwtAccessGuard làm global guard
    // Tất cả routes sẽ được bảo vệ bởi authentication
    // Trừ các routes có @Public() decorator
    {
      provide: APP_GUARD,
      useClass: JwtAccessGuard,
    },
  ],
})
export class AppModule {}
