import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { RbacModule } from '@modules/rbac/rbac.module';
import { DoubleEntryEngine } from './double-entry.engine';
import { LedgerIntegrationService } from './ledger-integration.service';

@Module({
    imports: [PrismaModule, RbacModule],
    controllers: [LedgerController],
    providers: [LedgerService, DoubleEntryEngine, LedgerIntegrationService],
    exports: [LedgerService, DoubleEntryEngine, LedgerIntegrationService],
})
export class LedgerModule { }
