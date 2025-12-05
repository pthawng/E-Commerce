/**
 * App Configuration
 * Cấu hình ứng dụng dùng chung
 */

/**
 * App Name
 */
export const APP_NAME = 'Ray Paradis';

/**
 * App Version
 */
export const APP_VERSION = '1.0.0';

/**
 * Default Locale
 */
export const DEFAULT_LOCALE = 'vi';

/**
 * Supported Locales
 */
export const SUPPORTED_LOCALES = ['vi', 'en'] as const;

/**
 * Default Currency
 */
export const DEFAULT_CURRENCY = 'VND';

/**
 * Supported Currencies
 */
export const SUPPORTED_CURRENCIES = ['VND', 'USD', 'EUR'] as const;

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DATE: 'DD/MM/YYYY',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY_DATE: 'dd/MM/yyyy',
  DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
} as const;

/**
 * File Upload
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
} as const;

/**
 * Session/Token
 */
export const SESSION = {
  TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'user',
} as const;

