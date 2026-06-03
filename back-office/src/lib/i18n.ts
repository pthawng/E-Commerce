import type { Language } from "@/i18n/locales";

/**
 * Format a date according to the active language locale.
 * @example formatDate(new Date(), 'vi') → '28 tháng 5 năm 2026'
 */
export function formatDate(
  date: Date | string | number,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const localeMap: Record<Language, string> = {
    vi: "vi-VN",
    en: "en-US",
    zh: "zh-CN",
  };
  return new Intl.DateTimeFormat(localeMap[language], {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(d);
}

/**
 * Format a date+time string.
 * @example formatDateTime(new Date(), 'en') → 'May 28, 2026, 4:22 PM'
 */
export function formatDateTime(date: Date | string | number, language: Language): string {
  return formatDate(date, language, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a currency value.
 * Prices in the back-office are stored in EUR (€) for simplicity.
 * @example formatCurrency(48200, 'EUR', 'vi') → '€48.200'
 */
export function formatCurrency(
  amount: number,
  currency: string = "EUR",
  language: Language = "vi",
): string {
  const localeMap: Record<Language, string> = {
    vi: "vi-VN",
    en: "en-US",
    zh: "zh-CN",
  };
  try {
    return new Intl.NumberFormat(localeMap[language], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  } catch {
    // Fallback if currency code is unrecognized
    return `${currency} ${formatNumber(amount, language)}`;
  }
}

/**
 * Format a plain number with thousands separator.
 * @example formatNumber(48200, 'vi') → '48.200'
 * @example formatNumber(48200, 'en') → '48,200'
 * @example formatNumber(48200, 'zh') → '48,200'
 */
export function formatNumber(
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions,
): string {
  const localeMap: Record<Language, string> = {
    vi: "vi-VN",
    en: "en-US",
    zh: "zh-CN",
  };
  return new Intl.NumberFormat(localeMap[language], options).format(value);
}

/**
 * Format a percentage value.
 * @example formatPercent(0.984, 'vi') → '98,4%'
 */
export function formatPercent(value: number, language: Language, decimals: number = 1): string {
  const localeMap: Record<Language, string> = {
    vi: "vi-VN",
    en: "en-US",
    zh: "zh-CN",
  };
  return new Intl.NumberFormat(localeMap[language], {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
