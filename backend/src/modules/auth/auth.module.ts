import { AuthController } from '@modules/auth/auth.controller';
import { AuthService } from '@modules/auth/auth.service';
import { JwtAccessGuard } from '@modules/auth/guard/access-jwt.guard';
import { JwtRefreshGuard } from '@modules/auth/guard/refresh-jwt.guard';
import { JwtAccessStrategy } from '@modules/auth/strategies/access-jwt.strategy';
import { JwtRefreshStrategy } from '@modules/auth/strategies/refresh-jwt.strategy';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (_configService: ConfigService) => ({
        // JwtModule config cho JwtService (dùng trong AuthService)
        // Strategies sẽ tự config secret riêng
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy, JwtAccessGuard, JwtRefreshGuard],
  exports: [AuthService, JwtAccessGuard, JwtRefreshGuard],
})
export class AuthModule {}
