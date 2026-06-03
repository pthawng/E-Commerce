import { SystemSettingService } from '@modules/system/system-setting.service';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';

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
  private readonly logger = new Logger(CheckoutTokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly settings: SystemSettingService,
  ) {}

  async generateToken(payload: Omit<CheckoutTokenPayload, 'expiresAt' | 'jti'>): Promise<string> {
    try {
      const timeoutMinutes = await this.settings.getNumber('order.checkoutTimeoutMinutes');
      const expiresIn = `${timeoutMinutes}m` as NonNullable<JwtSignOptions['expiresIn']>;
      const jti = randomUUID();
      const expiresAt = Date.now() + timeoutMinutes * 60 * 1000;

      this.logger.debug(`Generating checkout token with JTI: ${jti}`);

      return this.jwtService.sign(
        {
          ...payload,
          jti,
          expiresAt,
        },
        {
          secret: this.configService.get<string>('JWT_CHECKOUT_SECRET'),
          expiresIn,
        },
      );
    } catch (error) {
      this.logger.error(`Error generating checkout token: ${error.message}`, error.stack);
      throw error;
    }
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
