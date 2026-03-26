import { Injectable, Logger } from '@nestjs/common';
import { PaymentProcessingStatus, PaymentGatewayProvider } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentService } from '../payment.service';

export interface BankTransaction {
    amount: number;
    description: string;
    transactionDate: Date;
    referenceId?: string;
}

/**
 * VietQR Matching Service
 * Automates the matching of bank transfers to pending payments
 */
@Injectable()
export class VietQRMatchingService {
    private readonly logger = new Logger(VietQRMatchingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentService: PaymentService,
    ) {}

    /**
     * Process an incoming bank transaction
     * Attempts to find a matching INIT payment and confirm it
     */
    async processIncomingTransaction(bankTx: BankTransaction): Promise<boolean> {
        this.logger.log(`Processing incoming bank transaction: ${bankTx.amount} - ${bankTx.description}`);

        // 1. Find all pending VIETQR payments
        const pendingPayments = await this.prisma.payment.findMany({
            where: {
                provider: PaymentGatewayProvider.VIETQR,
                status: PaymentProcessingStatus.INIT,
            },
        });

        // 2. Clean description for easier matching
        const cleanDesc = bankTx.description.toUpperCase().replace(/\s+/g, '');

        // 3. Look for a match based on amount AND transferCode
        for (const payment of pendingPayments) {
            const metadata = payment.rawPayload as any;
            const transferCode = metadata?.transferCode;

            if (!transferCode) continue;

            const isAmountMatch = Number(payment.amount) === bankTx.amount;
            const isCodeMatch = cleanDesc.includes(transferCode.toUpperCase());

            if (isAmountMatch && isCodeMatch) {
                this.logger.log(`Match found! Payment ${payment.id} matches bank transaction.`);
                
                // 4. Confirm the payment
                try {
                    await this.paymentService.processCallback(payment.provider as any, {
                        orderId: payment.orderId,
                        transactionId: payment.providerTransactionId,
                        amount: bankTx.amount,
                        status: 'success',
                        gatewayResponse: {
                            bankTransaction: bankTx,
                            matchedAt: new Date(),
                            matchType: 'AUTO_DESCRIPTION',
                        },
                    });
                    return true;
                } catch (error) {
                    this.logger.error(`Failed to confirm matched VietQR payment: ${error.message}`);
                    return false;
                }
            }
        }

        this.logger.warn(`No matching pending payment found for bank transaction: ${bankTx.description}`);
        return false;
    }
}
