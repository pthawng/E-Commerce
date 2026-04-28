import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "en" | "vi" | "zh";
export type Currency = "USD" | "VND" | "CNY";

const localeToCurrency: Record<Locale, Currency> = {
  en: "USD",
  vi: "VND",
  zh: "CNY",
};

interface SettingsState {
  locale: Locale;
  currency: Currency;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: "vi",
      currency: "VND",
      setLocale: (locale) =>
        set({
          locale,
          currency: localeToCurrency[locale],
        }),
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: "ray-paradis-settings",
    },
  ),
);
