import { API_ENDPOINTS, buildApiUrl } from '@shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'en' | 'vi' | 'zh';
type Currency = 'USD' | 'VND' | 'CNY';
type ExchangeRates = Partial<Record<Currency, number>>;

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  locale: string;
}

export const currencyConfigs: Record<Currency, CurrencyConfig> = {
  VND: {
    code: 'VND',
    symbol: 'VND',
    locale: 'vi-VN',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
  },
  CNY: {
    code: 'CNY',
    symbol: 'CNY',
    locale: 'zh-CN',
  },
};

const baseExchangeRates: ExchangeRates = { VND: 1 };

const EXCHANGE_RATE_TTL = 12 * 60 * 60 * 1000;

interface AppState {
  theme: Theme;
  language: Language;
  currency: Currency;
  exchangeRates: ExchangeRates;
  exchangeRatesUpdatedAt: number | null;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  hydrateExchangeRates: (options?: { force?: boolean }) => Promise<void>;
  formatPrice: (priceInVND: number) => string;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      currency: 'USD',
      exchangeRates: baseExchangeRates,
      exchangeRatesUpdatedAt: null,
      setTheme: (theme) => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        set({ theme });
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(newTheme);
          return { theme: newTheme };
        });
      },
      setLanguage: (language) => {
        // Users can choose UI language independently from display/payment currency.
        set({ language });
      },
      setCurrency: (currency) => {
        set({ currency });
        void get().hydrateExchangeRates({ force: true });
      },
      hydrateExchangeRates: async (options) => {
        const { exchangeRatesUpdatedAt } = get();
        if (
          !options?.force &&
          exchangeRatesUpdatedAt &&
          Date.now() - exchangeRatesUpdatedAt < EXCHANGE_RATE_TTL
        ) {
          return;
        }

        try {
          const url = buildApiUrl(
            `${API_ENDPOINTS.SYSTEM.CURRENCY_RATES}?targetCurrencies=USD,CNY`,
          );
          const response = await fetch(url, { credentials: 'include' });
          if (!response.ok) return;

          const data = (await response.json()) as {
            base: string;
            rates?: Partial<Record<Currency, number>>;
          };

          if (data.base !== 'VND' || !data.rates) return;

          set({
            exchangeRates: {
              ...baseExchangeRates,
              ...data.rates,
              VND: 1,
            },
            exchangeRatesUpdatedAt: Date.now(),
          });
        } catch {
          // Keep fallback rates when backend rates are temporarily unavailable.
        }
      },
      formatPrice: (priceInVND: number) => {
        const { currency, exchangeRates } = get();
        const rate = exchangeRates[currency];
        const activeCurrency = rate ? currency : 'VND';
        const config = currencyConfigs[activeCurrency];
        const convertedPrice = priceInVND * (rate ?? 1);

        return new Intl.NumberFormat(config.locale, {
          style: 'currency',
          currency: config.code,
          maximumFractionDigits: activeCurrency === 'VND' ? 0 : 2,
        }).format(convertedPrice);
      },
    }),
    {
      name: 'ray-paradis-store',
      version: 2,
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        currency: state.currency,
      }),
      migrate: (persistedState: any): any => {
        const state = persistedState as Partial<AppState>;
        return {
          theme: state.theme || 'light',
          language: state.language || 'en',
          currency: state.currency || 'VND',
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(state.theme);
        }
      },
    },
  ),
);
