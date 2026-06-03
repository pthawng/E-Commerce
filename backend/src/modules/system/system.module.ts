import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { RbacModule } from 'src/modules/rbac/rbac.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ApprovalService } from './approval.service';
import { CurrencyController, PublicCurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { SystemSettingController } from './system-setting.controller';
import { SystemSettingService } from './system-setting.service';

@Module({
  imports: [PrismaModule, RbacModule, CacheModule.register()],
  controllers: [SystemSettingController, CurrencyController, PublicCurrencyController],
  providers: [SystemSettingService, CurrencyService, ApprovalService],
  exports: [SystemSettingService, CurrencyService, ApprovalService],
})
export class SystemModule {}
