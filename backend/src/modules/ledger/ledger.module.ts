import { RbacModule } from '@modules/rbac/rbac.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SystemModule } from '../system/system.module';
import { DoubleEntryEngine } from './double-entry.engine';
import { LedgerIntegrationService } from './ledger-integration.service';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';

@Module({
  imports: [PrismaModule, RbacModule, SystemModule],
  controllers: [LedgerController],
  providers: [LedgerService, DoubleEntryEngine, LedgerIntegrationService],
  exports: [LedgerService, DoubleEntryEngine, LedgerIntegrationService],
})
export class LedgerModule {}
