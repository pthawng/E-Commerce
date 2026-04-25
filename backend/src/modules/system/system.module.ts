import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RbacModule } from 'src/modules/rbac/rbac.module';
import { SystemSettingService } from './system-setting.service';
import { SystemSettingController } from './system-setting.controller';
import { CurrencyService } from './currency.service';
import { CurrencyController, PublicCurrencyController } from './currency.controller';

@Module({
    imports: [PrismaModule, RbacModule],
    controllers: [SystemSettingController, CurrencyController, PublicCurrencyController],
    providers: [SystemSettingService, CurrencyService],
    exports: [SystemSettingService, CurrencyService],
})
export class SystemModule { }
