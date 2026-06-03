import { MailModule } from '@modules/mail/mail.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { SystemModule } from '@modules/system/system.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';

import { BackOfficeAuditLogService } from './services/back-office-audit-log.service';
import { BackOfficeAuthService } from './services/back-office-auth.service';
import { BackOfficeSessionService } from './services/back-office-session.service';
import { BackOfficeStaffService } from './services/back-office-staff.service';

import { BackOfficeAuthController } from './controllers/back-office-auth.controller';
import { BackOfficeSessionController } from './controllers/back-office-session.controller';
import { BackOfficeStaffController } from './controllers/back-office-staff.controller';
import { BackOfficeSystemSettingsController } from './controllers/back-office-system-settings.controller';

import { BackOfficeAuthGuard } from './guards/back-office-auth.guard';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    RbacModule,
    SystemModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('BACK_OFFICE_MFA_JWT_SECRET') ??
          configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    BackOfficeAuthController,
    BackOfficeStaffController,
    BackOfficeSessionController,
    BackOfficeSystemSettingsController,
  ],
  providers: [
    BackOfficeAuthService,
    BackOfficeSessionService,
    BackOfficeStaffService,
    BackOfficeAuditLogService,
    BackOfficeAuthGuard,
  ],
  exports: [
    BackOfficeAuthService,
    BackOfficeSessionService,
    BackOfficeStaffService,
    BackOfficeAuditLogService,
    BackOfficeAuthGuard,
  ],
})
export class BackOfficeAuthModule {}
