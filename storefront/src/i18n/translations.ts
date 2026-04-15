import { locales } from './locales';

/**
 * Scalable i18n Translations
 * Principal Fix: Modularized into namespaces (locales/ directory) 
 * for better maintainability and horizontal scaling of features.
 */
export const translations = locales;

// Export keys as a type for better IDE intellisense in t() functions
export type TranslationKey = keyof typeof translations.en;
