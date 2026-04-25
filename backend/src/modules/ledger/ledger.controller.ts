import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { ReconciliationStatus } from '@prisma/client';

@Controller('ledger')
export class LedgerController {
    constructor(private readonly ledgerService: LedgerService) { }

    @Get('balances')
    @Permission('ledger.view')
    async getBalances() {
        return this.ledgerService.getMaterialBalances();
    }

    @Get('flows')
    @Permission('ledger.view')
    async getFlows(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.ledgerService.getFinancialFlows(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Get('kpis')
    @Permission('ledger.view')
    async getKPIs() {
        return this.ledgerService.getLedgerKPIs();
    }

    @Post('reconcile/:id')
    @Permission('ledger.manage')
    async reconcile(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: ReconciliationStatus,
    ) {
        return this.ledgerService.reconcileTransaction(id, status);
    }

    @Post('audit')
    @Permission('ledger.manage')
    async runAudit() {
        return this.ledgerService.runForensicAudit();
    }
}
