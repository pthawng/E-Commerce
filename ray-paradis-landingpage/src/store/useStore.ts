import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'en' | 'vi';
type Currency = 'USD' | 'VND';

// User info moved to useAuthStore for Single Source of Truth

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  locale: string;
  rate: number; 
}

export const currencyConfigs: Record<Currency, CurrencyConfig> = {
  VND: {
    code: 'VND',
    symbol: '₫',
    locale: 'vi-VN',
    rate: 1,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    rate: 0.00004,
  },
};

interface AppState {
  theme: Theme;
  language: Language;
  currency: Currency;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceInVND: number) => string;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      currency: 'USD',
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
        // Auto-switch currency based on language
        const currency: Currency = language === 'vi' ? 'VND' : 'USD';
        set({ language, currency });
      },
      setCurrency: (currency) => set({ currency }),
      formatPrice: (priceInVND: number) => {
        const { currency } = get();
        const config = currencyConfigs[currency];
        const convertedPrice = priceInVND * config.rate;
        
        return new Intl.NumberFormat(config.locale, {
          style: 'currency',
          currency: config.code,
          maximumFractionDigits: currency === 'VND' ? 0 : 2,
        }).format(convertedPrice);
      },
    }),
    {
      name: 'ray-paradis-store',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(state.theme);
        }
      },
    }
  )
);
