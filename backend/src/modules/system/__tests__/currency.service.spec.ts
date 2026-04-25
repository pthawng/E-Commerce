import axios from 'axios';
import { CurrencyService } from '../currency.service';

jest.mock('axios');

describe('CurrencyService', () => {
  const axiosGet = axios.get as jest.Mock;

  const prisma = {
    currencyRate: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const config = {
    get: jest.fn((key: string, fallback: string) => {
      const values: Record<string, string> = {
        SYSTEM_BASE_CURRENCY: 'VND',
        CURRENCY_API_URL: 'https://example.test/latest/{base}',
      };
      return values[key] ?? fallback;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches VND to USD from provider response and persists the precise rate', async () => {
    axiosGet.mockResolvedValue({
      data: {
        base_code: 'VND',
        conversion_rates: {
          USD: 0.000041,
        },
      },
    });

    const service = new CurrencyService(prisma as any, config as any);

    const rate = await service.getRate('USD');

    expect(rate).toBe(0.000041);
    expect(axiosGet).toHaveBeenCalledWith('https://example.test/latest/VND');
    expect(prisma.currencyRate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        baseCurrency: 'VND',
        targetCurrency: 'USD',
        rate: expect.objectContaining({
          toString: expect.any(Function),
        }),
      }),
    });
    expect(prisma.currencyRate.create.mock.calls[0][0].data.rate.toString()).toBe('0.000041');
  });

  it('falls back to the latest DB rate when provider fails', async () => {
    axiosGet.mockRejectedValue(new Error('network down'));
    prisma.currencyRate.findFirst.mockResolvedValue({ rate: 0.00004 });

    const service = new CurrencyService(prisma as any, config as any);

    await expect(service.getRate('USD')).resolves.toBe(0.00004);
    expect(prisma.currencyRate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          baseCurrency: 'VND',
          targetCurrency: 'USD',
        }),
      }),
    );
  });

  it('ignores provider data when the response base does not match VND', async () => {
    axiosGet.mockResolvedValue({
      data: {
        base: 'EUR',
        rates: {
          USD: 1.08,
        },
      },
    });
    prisma.currencyRate.findFirst.mockResolvedValue({ rate: 0.00004 });

    const service = new CurrencyService(prisma as any, config as any);

    await expect(service.getRate('USD')).resolves.toBe(0.00004);
    expect(prisma.currencyRate.create).not.toHaveBeenCalled();
  });

  it('throws when provider and DB rates are unavailable instead of using a hardcoded rate', async () => {
    axiosGet.mockRejectedValue(new Error('network down'));
    prisma.currencyRate.findFirst.mockResolvedValue(null);

    const service = new CurrencyService(prisma as any, config as any);

    await expect(service.getRate('USD')).rejects.toThrow('Exchange rate unavailable for USD');
  });
});
