import { Injectable, Logger } from '@nestjs/common';
import { JournalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DoubleEntryEngine } from './double-entry.engine';

@Injectable()
export class LedgerIntegrationService {
  private readonly logger = new Logger(LedgerIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly doubleEntry: DoubleEntryEngine,
  ) {}

  /**
   * Records revenue and asset increase from a successful order payment.
   * L8 Grade: Creates an atomic journal entry with debit/credit pairs.
   */
  async recordOrderPayment(orderId: string, amount: number, tx: Prisma.TransactionClient) {
    this.logger.log(`Recording ledger entry for order payment: ${orderId}`);

    // Standard Accounts (In production, these come from a Chart of Accounts service)
    const CASH_ACCOUNT_CODE = '1001';
    const REVENUE_ACCOUNT_CODE = '4001';

    const [cashAccount, revenueAccount] = await Promise.all([
      tx.ledgerAccount.findUnique({ where: { code: CASH_ACCOUNT_CODE } }),
      tx.ledgerAccount.findUnique({ where: { code: REVENUE_ACCOUNT_CODE } }),
    ]);

    if (!cashAccount || !revenueAccount) {
      throw new Error('Critical: Ledger accounts not initialized.');
    }

    // 1. Create Journal Entry (DRAFT)
    const journal = await tx.journalEntry.create({
      data: {
        code: `JE-PAY-${Date.now()}`,
        description: `Payment received for Order ${orderId}`,
        referenceId: orderId,
        referenceType: 'ORDER',
        status: JournalStatus.DRAFT,
        lines: {
          create: [
            {
              accountId: cashAccount.id,
              debit: new Prisma.Decimal(amount),
              credit: new Prisma.Decimal(0),
              note: 'Cash Increase (Asset)',
            },
            {
              accountId: revenueAccount.id,
              debit: new Prisma.Decimal(0),
              credit: new Prisma.Decimal(amount),
              note: 'Revenue Recognition',
            },
          ],
        },
      },
    });

    // 2. Post via DoubleEntryEngine (Validation + Status change)
    // Note: We use tx to ensure it's part of the same transaction as the payment confirmation
    return this.doubleEntry.postJournal(journal.id);
  }
}
