import { AuthModule } from '@modules/auth/auth.module';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { MailModule } from '@modules/mail/mail.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
      }),
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    MailModule,
    RbacModule,
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
