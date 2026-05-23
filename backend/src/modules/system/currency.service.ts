import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Internal Type Extension
 * This shadow interface bridges the gap while Prisma Client generation
 * propagates through the environment.
 */
type HardenedPrisma = PrismaService & {
  currencyRate: Prisma.CurrencyRateDelegate<any>;
};

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly BASE_CURRENCY: string;
  private readonly API_URL: string;

  // In-memory cache for the current session
  private rateCache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 12 * 3600 * 1000; // 12 hours

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BASE_CURRENCY = this.configService.get<string>('SYSTEM_BASE_CURRENCY', 'VND');
    this.API_URL = this.configService.get<string>(
      'CURRENCY_API_URL',
      'https://api.frankfurter.app/latest?from={base}&to={target}',
    );
  }

  private get prisma(): HardenedPrisma {
    return this.prismaService as unknown as HardenedPrisma;
  }

  /**
   * Get exchange rate from BASE (VND) to TARGET
   * Implements multilayer fallback: Cache -> External API -> recent DB.
   * No hardcoded FX rates are used; stale/missing rates must fail closed.
   */
  async getRate(targetCurrency: string): Promise<number> {
    if (targetCurrency === this.BASE_CURRENCY) return 1.0;

    // 1. Check Memory Cache
    const cached = this.rateCache.get(targetCurrency);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.rate;
    }

    try {
      // 2. Fetch from External API
      // Supporting multiple providers: Frankfurter (rates) and ExchangeRate-API (conversion_rates)
      const response = await axios.get(this.buildRateUrl(targetCurrency));

      const responseBase = response.data.base_code || response.data.base;
      if (responseBase && responseBase !== this.BASE_CURRENCY) {
        this.logger.warn(
          `Currency provider returned base=${responseBase}, expected=${this.BASE_CURRENCY}. Ignoring response.`,
        );
        throw new Error('Unexpected currency provider base');
      }

      const rates = response.data.conversion_rates || response.data.rates;
      const rate = rates ? rates[targetCurrency] : null;

      if (rate) {
        await this.persistRate(targetCurrency, rate, 'ExternalAPI');
        return rate;
      }
    } catch (error) {
      this.logger.warn(
        `External API fetch failed for ${targetCurrency}: ${error.message}. Falling back to DB.`,
      );
    }

    // 3. Fallback to DB (Last 24h)
    const dbRate = await this.prisma.currencyRate.findFirst({
      where: {
        baseCurrency: this.BASE_CURRENCY,
        targetCurrency: targetCurrency,
        fetchedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
      },
      orderBy: { fetchedAt: 'desc' },
    });

    if (dbRate) {
      this.updateMemoryCache(targetCurrency, Number(dbRate.rate));
      return Number(dbRate.rate);
    }

    this.logger.error(`CRITICAL: No recent exchange rate found for ${targetCurrency}.`);
    throw new ServiceUnavailableException(`Exchange rate unavailable for ${targetCurrency}`);
  }

  private buildRateUrl(targetCurrency: string): string {
    if (this.API_URL.includes('{base}') || this.API_URL.includes('{target}')) {
      return this.API_URL.replace('{base}', encodeURIComponent(this.BASE_CURRENCY)).replace(
        '{target}',
        encodeURIComponent(targetCurrency),
      );
    }

    const url = new URL(this.API_URL);
    url.searchParams.set('from', this.BASE_CURRENCY);
    url.searchParams.set('to', targetCurrency);
    return url.toString();
  }

  /**
   * Persist rate to DB and Memory Cache
   */
  private async persistRate(targetCurrency: string, rate: number, source: string) {
    try {
      await this.prisma.currencyRate.create({
        data: {
          baseCurrency: this.BASE_CURRENCY,
          targetCurrency,
          rate: new Prisma.Decimal(rate),
          source,
          fetchedAt: new Date(),
        },
      });
      this.updateMemoryCache(targetCurrency, rate);
    } catch (error) {
      this.logger.error(`Failed to persist rate to DB: ${error.message}`);
    }
  }

  private updateMemoryCache(target: string, rate: number) {
    this.rateCache.set(target, { rate, timestamp: Date.now() });
  }
}
