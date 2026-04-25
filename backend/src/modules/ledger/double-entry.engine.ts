import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { JournalStatus } from '@prisma/client';

@Injectable()
export class DoubleEntryEngine {
    private readonly logger = new Logger(DoubleEntryEngine.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Posts a journal entry to the ledger.
     * L8 Grade: Enforces zero-sum balance and atomic posting.
     */
    async postJournal(journalId: string) {
        return this.prisma.$transaction(async (tx) => {
            const journal = await tx.journalEntry.findUnique({
                where: { id: journalId },
                include: { lines: true },
            });

            if (!journal) throw new BadRequestException('Journal entry not found');
            if (journal.status === JournalStatus.POSTED) throw new BadRequestException('Journal already posted');

            // 1. Validate Zero-Sum Balance
            this.validateBalance(journal.lines);

            // 2. Mark as Posted
            const updatedJournal = await tx.journalEntry.update({
                where: { id: journalId },
                data: {
                    status: JournalStatus.POSTED,
                    postedAt: new Date(),
                },
            });

            this.logger.log(`Journal ${journal.code} posted successfully.`);
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
            throw new BadRequestException(`Journal is imbalanced by ${imbalance}. Double-entry rule violated.`);
        }
    }
}
