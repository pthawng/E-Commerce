import { GuestVerificationService } from '@modules/auth/services/guest-verification.service';
import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';

@Injectable()
export class CheckoutValidator {
  private readonly logger = new Logger(CheckoutValidator.name);

  constructor(private readonly guestVerificationService: GuestVerificationService) {}

  /**
   * Validates guest email verification token.
   */
  async validateGuest(email?: string, token?: string) {
    if (email) {
      if (!token) {
        throw new BadRequestException('Email guest chưa được xác thực (missing token).');
      }
      await this.guestVerificationService.validateVerifyToken(email, token);
    }
  }

  /**
   * Validates that the checkout token belongs to the current user/session.
   */
  validateTokenOwnership(tokenPayload: any, userId?: string, sessionId?: string) {
    if (tokenPayload.userId && tokenPayload.userId !== userId) {
      throw new BadRequestException('Checkout token ownership mismatch (User)');
    }
    if (!tokenPayload.userId && tokenPayload.sessionId !== sessionId) {
      throw new BadRequestException('Checkout token ownership mismatch (Session)');
    }
  }

  /**
   * Validates cart content stability.
   */
  validateCartStability(currentItems: any[], tokenCartHash: string) {
    const currentCartHash = this.generateCartHash(currentItems);
    if (currentCartHash !== tokenCartHash) {
      throw new ConflictException({
        code: 'CART_HASH_MISMATCH',
        message: 'Cart content has changed. Please re-validate checkout.',
      });
    }
  }

  /**
   * Validates price stability between token snapshot and current database state.
   */
  validatePriceStability(
    currentTotal: number,
    tokenTotal: number,
    currentItems: any[],
    tokenItems: any[],
  ) {
    // 1. Total comparison (VND integer-safe)
    const isTotalSafe = Math.abs(Math.round(currentTotal) - Math.round(tokenTotal)) <= 1;

    if (!isTotalSafe) {
      this.logger.warn(`Price mismatch: Expected ${tokenTotal}, Actual ${currentTotal}`);
      throw new ConflictException({
        code: 'PRICE_STABILITY_ERROR',
        message: 'Price has changed since validation. Please review your order totals.',
        details: { expected: tokenTotal, actual: currentTotal },
      });
    }

    // 2. Individual line item comparison (forensic check)
    for (const item of currentItems) {
      const snapshotItem = tokenItems.find((ti) => ti.variantId === item.productVariantId);
      const currentPrice = Math.round(Number(item.price));
      const snapshotPrice = Math.round(snapshotItem?.price || 0);

      if (currentPrice !== snapshotPrice) {
        throw new ConflictException({
          code: 'PRICE_STABILITY_ERROR',
          message: 'One or more item prices have changed.',
        });
      }
    }
  }

  public generateCartHash(items: any[]): string {
    const data = items
      .map((i) => `${i.productVariantId}:${i.quantity}`)
      .sort()
      .join('|');
    return createHash('sha256').update(data).digest('hex');
  }
}
