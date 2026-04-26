import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../settingsStore';
import { useCallback, useMemo } from 'react';
import { useExchangeRates } from './useExchangeRates';

/**
 * Currency Converter Hook
 * 
 * Provides high-precision currency conversion and formatting 
 * following strict locale rounding rules.
 */
export const useCurrencyConverter = () => {
    const { i18n } = useTranslation();
    const { currency: targetCurrency } = useSettingsStore();
    const { data: exchangeData, isLoading } = useExchangeRates();

    /**
     * Resolve the cross-domain rate
     */
    const rate = useMemo(() => {
        if (!exchangeData || targetCurrency === 'VND') return 1.0;
        return exchangeData.rates?.[targetCurrency] || 1.0;
    }, [exchangeData, targetCurrency]);

    /**
     * Convert value from BASE (VND) to Target
     */
    const convert = useCallback((amountVnd: number): number => {
        return amountVnd * rate;
    }, [rate]);

    /**
     * Format currency based on locale and strict rounding rules
     */
    const format = useCallback((amount: number, overrideCurrency?: string) => {
        const activeCurrency = overrideCurrency || targetCurrency;

        // L8 Rounding Rules:
        // VND/JPY -> 0 decimals
        // USD/EUR/CNY -> 2 decimals
        const fractionDigits = (activeCurrency === 'VND' || activeCurrency === 'JPY') ? 0 : 2;

        try {
            // L8 Formatting Logic: Use standard currency locales for international currencies
            // USD -> en-US (standard $ placement)
            // CNY -> zh-CN (standard ¥ placement)
            // Others -> Current language locale
            const formattingLocale = activeCurrency === 'USD' ? 'en-US' : (activeCurrency === 'CNY' ? 'zh-CN' : i18n.language);

            return new Intl.NumberFormat(formattingLocale, {
                style: 'currency',
                currency: activeCurrency,
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
            }).format(amount);
        } catch (e) {
            // Fallback for unsupported currencies or Locales
            return `${activeCurrency} ${amount.toFixed(fractionDigits)}`;
        }
    }, [i18n.language, targetCurrency]);

    /**
     * Convert AND Format in one go
     */
    const convertAndFormat = useCallback((amountVnd: number) => {
        const converted = convert(amountVnd);
        return format(converted);
    }, [convert, format]);

    return {
        convert,
        format,
        convertAndFormat,
        targetCurrency,
        rate,
        isLoading,
    };
};
