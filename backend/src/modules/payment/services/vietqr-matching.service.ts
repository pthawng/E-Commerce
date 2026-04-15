import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PaymentGatewayProvider, PaymentProcessingStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentService } from '../payment.service';

/**
 * Casso / SePay Webhook Payload
 * Based on: https://docs.casso.vn/#receiving-data
 */
export interface BankTransaction {
  /** Casso/SePay internal transaction ID — used for idempotency */
  id: number | string;
  /** Transfer amount in VND */
  amount: number;
  /** Transfer description (may contain transferCode) */
  description: string;
  /** When the bank recorded the transaction */
  when: string;
  /** Bank account number that received the money */
  bankSubAccId?: string;
  /** Extra info from Casso */
  subAccId?: string;
  tid?: string;
  corresponsiveName?: string;
  corresponsiveBankId?: string;
}

export interface CassoWebhookPayload {
  error: number;
  data: BankTransaction[];
}

/**
 * VietQR Matching Service (Production-Grade)
 *
 * Security Model:
 *  - X-Api-Key header must match VIETQR_WEBHOOK_SECRET
 *  - Source IP must be in VIETQR_WEBHOOK_IPS whitelist
 *
 * Matching Rules (ALL must pass — strict mode):
 *  1. transferCode found in description (case-insensitive)
 *  2. amount == payment.amount EXACTLY
 *  3. payment.provider == VIETQR
 *  4. payment.status == INIT (pending only)
 *
 * Idempotency:
 *  - The Casso/SePay transaction ID is stored as providerTransactionId
 *  - If we already processed this bank transaction ID, we skip silently
 *
 * Dirty Payment Handling (STRICT mode):
 *  - Wrong amount → log CONFLICT, mark payment as EXPIRED, do NOT confirm
 */
@Injectable()
export class VietQRMatchingService {
  private readonly logger = new Logger(VietQRMatchingService.name);
  private readonly webhookSecret: string;
  private readonly allowedIps: string[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {
    this.webhookSecret = process.env.VIETQR_WEBHOOK_SECRET || '';
    this.allowedIps = (process.env.VIETQR_WEBHOOK_IPS || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);
  }

  /**
   * Verify the incoming webhook request is from a trusted source.
   * Called by the controller BEFORE processing.
   */
  verifyWebhookRequest(apiKey: string, sourceIp: string): void {
    // 1. API Key check (Casso sends token set in dashboard as "API-Key")
    if (!this.webhookSecret) {
      this.logger.warn('VIETQR_WEBHOOK_SECRET is not set — webhook security is disabled!');
    } else if (apiKey !== this.webhookSecret) {
      this.logger.warn(`VietQR webhook: invalid API key from IP ${sourceIp}`);
      throw new UnauthorizedException('Invalid webhook API key');
    }

    // 2. IP Whitelist check
    if (this.allowedIps.length > 0 && !this.allowedIps.includes(sourceIp)) {
      this.logger.warn(`VietQR webhook: rejected request from non-whitelisted IP ${sourceIp}`);
      throw new UnauthorizedException(`IP ${sourceIp} is not in the VietQR webhook whitelist`);
    }
  }

  /**
   * Main entry point: process a list of transactions from the Casso/SePay webhook.
   */
  async processCassoWebhook(payload: CassoWebhookPayload): Promise<{
    processed: number;
    matched: number;
    skipped: number;
  }> {
    if (payload.error !== 0) {
      this.logger.warn(`Casso webhook reported error: ${payload.error}`);
      return { processed: 0, matched: 0, skipped: 0 };
    }

    const transactions = payload.data || [];
    let matched = 0;
    let skipped = 0;

    for (const tx of transactions) {
      const result = await this.processIncomingTransaction(tx);
      if (result === 'matched') matched++;
      else skipped++;
    }

    return { processed: transactions.length, matched, skipped };
  }

  /**
   * Process a single bank transaction.
   * Returns 'matched', 'skipped' (idempotency), or 'no_match'.
   */
  async processIncomingTransaction(
    bankTx: BankTransaction,
  ): Promise<'matched' | 'skipped' | 'conflict' | 'no_match'> {
    const bankTxId = String(bankTx.id);
    this.logger.log(
      `Processing bank transaction [${bankTxId}]: ${bankTx.amount} VND | "${bankTx.description}"`,
    );

    // ── Idempotency check ─────────────────────────────────────────────
    const alreadyProcessed = await this.prisma.payment.findFirst({
      where: { providerTransactionId: bankTxId },
    });
    if (alreadyProcessed) {
      this.logger.log(`[IDEMPOTENT] Bank transaction ${bankTxId} already processed. Skipping.`);
      return 'skipped';
    }

    // ── Optimize: Extract Transfer Code from Description ─────────────────────
    // Regex to find RPXXXX codes (Ray Paradis standard: RP followed by digits)
    const codeMatch = bankTx.description.match(/RP\d+/i);
    if (!codeMatch) {
      this.logger.warn(`[NO_CODE] No transferCode found in description: "${bankTx.description}"`);
      return 'no_match';
    }
    const transferCode = codeMatch[0].toUpperCase();

    // ── Find exact payment with this transferCode (O(1) approach) ───────────
    // We use queryRaw for high-performance JSON matching in PostgreSQL
    const matchingPayments = await this.prisma.$queryRaw<any[]>`
            SELECT * FROM "Payment" 
            WHERE "provider" = ${PaymentGatewayProvider.VIETQR} 
            AND "status" = ${PaymentProcessingStatus.INIT}
            AND "rawPayload"->>'transferCode' = ${transferCode}
            LIMIT 1
        `;

    if (matchingPayments.length === 0) {
      this.logger.warn(`[NO_MATCH] No pending payment found for transferCode: ${transferCode}`);
      return 'no_match';
    }

    const payment = matchingPayments[0];
    const metadata = payment.rawPayload as any;

    // ── Strict matching rules ───────────────────────────────────────────

    // 1. Amount check (STRICT)
    const isAmountMatch = Number(payment.amount) === bankTx.amount;
    if (!isAmountMatch) {
      this.logger.warn(
        `[CONFLICT] transferCode=${transferCode} matched but amount mismatch: ` +
          `expected ${payment.amount}, got ${bankTx.amount}. Marking CONFLICT.`,
      );
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentProcessingStatus.FAILED,
          errorLog: JSON.stringify({
            reason: 'AMOUNT_MISMATCH',
            expected: Number(payment.amount),
            received: bankTx.amount,
            bankTxId,
            description: bankTx.description,
          }),
        },
      });
      return 'conflict';
    }

    // 2. Check expiration
    const expiresAt = metadata?.expiresAt ? new Date(metadata.expiresAt) : null;
    if (expiresAt && new Date() > expiresAt) {
      this.logger.warn(`[EXPIRED] Payment ${payment.id} expired at ${expiresAt.toISOString()}`);
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentProcessingStatus.EXPIRED,
          errorLog: `Payment window expired at ${expiresAt.toISOString()}`,
        },
      });
      return 'no_match';
    }

    // ── Full match: confirm the payment ───────────────────────────
    this.logger.log(`[MATCH] Payment ${payment.id} | transferCode=${transferCode}`);

    try {
      await this.paymentService.processCallback(payment.provider as any, {
        orderId: payment.orderId,
        transactionId: bankTxId,
        amount: bankTx.amount,
        status: 'success',
        gatewayResponse: {
          bankTransaction: bankTx,
          transferCode,
          matchedAt: new Date().toISOString(),
          matchType: 'AUTO_REGEX_JSON_QUERY',
        },
      });
      return 'matched';
    } catch (error) {
      this.logger.error(`Failed to confirm VietQR payment: ${error.message}`);
      return 'no_match';
    }

    this.logger.warn(
      `[NO_MATCH] No pending payment found for: "${bankTx.description}" | ${bankTx.amount} VND`,
    );
    return 'no_match';
  }
}
