/**
 * Centralized formatting utilities for the Luxury Admin system.
 */

export type CurrencyCode = 'USD' | 'VND';

interface FormatCurrencyOptions {
    currency?: CurrencyCode;
    showSymbol?: boolean;
    abbreviate?: boolean;
}

/**
 * Formats a number as a currency string.
 * L8 SE Note: Uses Intl.NumberFormat for robust, standard-compliant formatting.
 */
export const formatCurrency = (value: number, options: FormatCurrencyOptions = {}) => {
    const { currency = 'USD', showSymbol = true } = options;

    const locale = currency === 'VND' ? 'vi-VN' : 'en-US';

    const formatter = new Intl.NumberFormat(locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0, // No decimals for luxury overview unless necessary
    });

    return formatter.format(value);
};

/**
 * Intelligent number chunking for large values
 */
export const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
};
