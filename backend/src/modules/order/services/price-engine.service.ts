import { ConflictException, Injectable, Logger } from '@nestjs/common';

export interface PriceSnapshot {
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  exchangeRate: number;
}

@Injectable()
export class PriceEngineService {
  private readonly logger = new Logger(PriceEngineService.name);
  private readonly DEFAULT_SHIPPING_FEE = 30000; // VND

  /**
   * Calculates order totals with integer-safe rounding for VND.
   * Ensures that (Subtotal + Shipping + Tax - Discount) == Total exactly.
   */
  calculateTotals(params: {
    items: Array<{ price: number; quantity: number }>;
    shippingFee?: number;
    discountAmount?: number;
    taxRate?: number; // e.g. 0.08 for 8%
    currency?: string;
    exchangeRate?: number;
  }): PriceSnapshot {
    const currency = params.currency || 'VND';
    const exchangeRate = params.exchangeRate || 1.0;

    // 1. Calculate Subtotal (Base currency: VND)
    const subtotal = params.items.reduce((sum, item) => {
      return sum + Math.round(item.price * item.quantity);
    }, 0);

    const shipping = params.shippingFee ?? this.DEFAULT_SHIPPING_FEE;
    const discount = params.discountAmount ?? 0;

    // 2. Calculate Tax
    const tax = params.taxRate ? Math.round((subtotal - discount) * params.taxRate) : 0;

    // 3. Calculate Total
    const total = subtotal + shipping + tax - discount;

    // 4. Verification (Invariant Check)
    this.assertInvariants({ subtotal, shipping, discount, tax, total });

    return {
      subtotal,
      shipping,
      discount,
      tax,
      total,
      currency,
      exchangeRate,
    };
  }

  /**
   * Enforces strict financial rules.
   * Throws PRICING_INVARIANT_VIOLATION if the math doesn't add up.
   */
  private assertInvariants(snapshot: Omit<PriceSnapshot, 'currency' | 'exchangeRate'>) {
    const expected = snapshot.subtotal + snapshot.shipping + snapshot.tax - snapshot.discount;
    const drift = Math.abs(expected - snapshot.total);

    if (drift > 0) {
      this.logger.error(
        `[PriceEngine] Invariant Violation: expected=${expected}, actual=${snapshot.total}, drift=${drift}`,
      );
      throw new ConflictException({
        code: 'PRICING_INVARIANT_VIOLATION',
        message: 'Order total calculation drift detected.',
      });
    }
  }

  /**
   * Converts a base amount (VND) to a display amount using a frozen exchange rate.
   * Useful for PayPal/USD checkouts.
   */
  convertToDisplay(amount: number, exchangeRate: number): number {
    // For USD, we round to 2 decimal places.
    // For VND, we round to 0 decimal places.
    if (exchangeRate === 1) return Math.round(amount);
    return Number((amount * exchangeRate).toFixed(2));
  }
}
