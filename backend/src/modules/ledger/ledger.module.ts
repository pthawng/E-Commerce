import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { RbacModule } from '@modules/rbac/rbac.module';
import { DoubleEntryEngine } from './double-entry.engine';
import { LedgerIntegrationService } from './ledger-integration.service';
import { SystemModule } from '../system/system.module';

@Module({
    imports: [PrismaModule, RbacModule, SystemModule],
    controllers: [LedgerController],
    providers: [LedgerService, DoubleEntryEngine, LedgerIntegrationService],
    exports: [LedgerService, DoubleEntryEngine, LedgerIntegrationService],
})
export class LedgerModule { }
