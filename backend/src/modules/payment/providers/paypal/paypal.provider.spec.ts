import { ConfigService } from '@nestjs/config';
import { CurrencyService } from '@modules/system/currency.service';
import { PayPalProvider } from './paypal.provider';

const mockExecute = jest.fn();
let mockLastCreateRequest: any;

jest.mock('@paypal/checkout-server-sdk', () => {
  class OrdersCreateRequest {
    public body: any;

    prefer = jest.fn();

    requestBody(body: any) {
      this.body = body;
      mockLastCreateRequest = this;
    }
  }

  return {
    core: {
      SandboxEnvironment: jest.fn(),
      LiveEnvironment: jest.fn(),
      PayPalHttpClient: jest.fn().mockImplementation(() => ({
        execute: mockExecute,
      })),
    },
    orders: {
      OrdersCreateRequest,
      OrdersCaptureRequest: jest.fn(),
      OrdersGetRequest: jest.fn(),
    },
    payments: {
      CapturesRefundRequest: jest.fn().mockImplementation(() => ({
        requestBody: jest.fn(),
      })),
    },
  };
});

describe('PayPalProvider', () => {
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        PAYPAL_CLIENT_ID: 'client-id',
        PAYPAL_CLIENT_SECRET: 'client-secret',
        PAYPAL_MODE: 'sandbox',
      };
      return values[key] ?? fallback;
    }),
  };

  const currencyService = {
    getRate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLastCreateRequest = undefined;
    mockExecute.mockResolvedValue({
      result: {
        id: 'paypal-order-1',
        status: 'CREATED',
        links: [{ rel: 'approve', href: 'https://paypal.test/approve' }],
      },
    });
  });

  it('creates PayPal payment by converting VND to USD with frozen exchange rate', async () => {
    const provider = new PayPalProvider(
      config as unknown as ConfigService,
      currencyService as unknown as CurrencyService,
    );

    const result = await provider.createPayment('order-1', 1000000, {
      exchangeRate: 0.00004,
      returnUrl: 'https://shop.test/return',
      cancelUrl: 'https://shop.test/cancel',
    });

    expect(result.metadata?.amountUsd).toBe(40);
    expect(result.metadata?.exchangeRate).toBe(0.00004);
    expect(currencyService.getRate).not.toHaveBeenCalled();
    expect(mockLastCreateRequest.body.purchase_units[0].amount).toEqual({
      currency_code: 'USD',
      value: '40',
    });
  });

  it('falls back to CurrencyService rate when frozen exchange rate is missing', async () => {
    currencyService.getRate.mockResolvedValue(0.00004);
    const provider = new PayPalProvider(
      config as unknown as ConfigService,
      currencyService as unknown as CurrencyService,
    );

    const result = await provider.createPayment('order-1', 1000000);

    expect(currencyService.getRate).toHaveBeenCalledWith('USD');
    expect(result.metadata?.amountUsd).toBe(40);
  });
});
