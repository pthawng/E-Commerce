import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ApprovalType, JournalStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalService } from '../system/approval.service';

@Injectable()
export class DoubleEntryEngine {
  private readonly logger = new Logger(DoubleEntryEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
  ) {}

  /**
   * Posts a journal entry to the ledger.
   * Enforces zero-sum balance, atomic posting, and approval policy.
   */
  async postJournal(journalId: string, approverId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const journal = await tx.journalEntry.findUnique({
        where: { id: journalId },
        include: { lines: true },
      });

      if (!journal) throw new BadRequestException('Journal entry not found');
      if (journal.status === JournalStatus.POSTED)
        throw new BadRequestException('Journal already posted');

      // 1. Enforce a 4-eyes approval rule for high-value postings.
      // In production, we check if there's an APPROVED request for this journal
      await this.approvalService.verifyApproved(ApprovalType.LEDGER_POSTING, journalId);

      // 2. Validate Zero-Sum Balance
      this.validateBalance(journal.lines);

      // 3. Mark as Posted
      const updatedJournal = await tx.journalEntry.update({
        where: { id: journalId },
        data: {
          status: JournalStatus.POSTED,
          postedAt: new Date(),
          // We could also record the specific approval ID used
        },
      });

      this.logger.log(`Journal ${journal.code} posted successfully under 4-Eyes approval.`);
      return updatedJournal;
    });
  }

  /**
   * Critical check: sum(debit) must equal sum(credit)
   */
  private validateBalance(lines: any[]) {
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of lines) {
      totalDebit = totalDebit.plus(line.debit);
      totalCredit = totalCredit.plus(line.credit);
    }

    if (!totalDebit.equals(totalCredit)) {
      const imbalance = totalDebit.minus(totalCredit);
      this.logger.error(`Imbalanced journal detected! Imbalance: ${imbalance}`);
      throw new BadRequestException(
        `Journal is imbalanced by ${imbalance}. Double-entry rule violated.`,
      );
    }
  }
}
