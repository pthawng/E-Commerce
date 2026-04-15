import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface CheckoutTokenPayload {
  jti: string; // Unique Token ID for Idempotency
  cartHash: string;
  totalAmount: number; // Snapshot of total price (integer-safe precision)
  currency: string;
  lineItems: Array<{
    variantId: string;
    quantity: number;
    price: number;
  }>;
  userId?: string;
  sessionId?: string;
  expiresAt: number;
}

@Injectable()
export class CheckoutTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async generateToken(payload: Omit<CheckoutTokenPayload, 'expiresAt' | 'jti'>): Promise<string> {
    const expiresIn = this.configService.get<string>('JWT_CHECKOUT_EXPIRES_IN', '15m');
    const jti = crypto.randomUUID();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    return this.jwtService.sign(
      {
        ...payload,
        jti,
        expiresAt,
      },
      {
        secret: this.configService.get<string>('JWT_CHECKOUT_SECRET'),
        expiresIn: expiresIn as any,
      },
    );
  }

  async verifyToken(token: string): Promise<CheckoutTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<CheckoutTokenPayload>(token, {
        secret: this.configService.get<string>('JWT_CHECKOUT_SECRET'),
      });

      if (payload.expiresAt < Date.now()) {
        throw new UnauthorizedException('Checkout token expired');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid checkout token');
    }
  }
}
