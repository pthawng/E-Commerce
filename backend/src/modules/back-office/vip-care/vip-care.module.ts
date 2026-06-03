import { BackOfficeAuthModule } from '@modules/back-office-auth/back-office-auth.module';
import { RbacModule } from '@modules/rbac/rbac.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VipCareController } from './vip-care.controller';
import { VipCareService } from './vip-care.service';

@Module({
  imports: [PrismaModule, BackOfficeAuthModule, RbacModule],
  controllers: [VipCareController],
  providers: [VipCareService],
  exports: [VipCareService],
})
export class VipCareModule {}
