import { AuthController } from '@modules/auth/auth.controller';
import { AdminAuthController } from '@modules/auth/admin-auth.controller';
import { AuthService } from '@modules/auth/auth.service';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { AdminJwtAccessGuard } from '@modules/auth/guard/admin-access-jwt.guard';
import { JwtRefreshGuard } from '@modules/auth/guard/refresh-jwt.guard';
import { ForgotPassEmailService } from '@modules/auth/services/forgot-pass-email.auth.service';
import { VerifyEmailService } from '@modules/auth/services/verify-email.auth.service';
import { JwtAccessStrategy } from '@modules/auth/strategies/access-jwt.strategy';
import { JwtRefreshStrategy } from '@modules/auth/strategies/refresh-jwt.strategy';
import { MailModule } from '@modules/mail/mail.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    UserModule,
    PassportModule,
    MailModule,
    RbacModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (_configService: ConfigService) => ({
        // JwtModule config cho JwtService (dùng trong AuthService)
        // Strategies sẽ tự config secret riêng
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtAccessGuard,
    AdminJwtAccessGuard,
    JwtRefreshGuard,
    VerifyEmailService,
    ForgotPassEmailService,
  ],
  exports: [AuthService, JwtAccessGuard, AdminJwtAccessGuard, JwtRefreshGuard],
})
export class AuthModule {}
