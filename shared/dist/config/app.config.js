"use strict";
/**
 * App Configuration
 * Cấu hình ứng dụng dùng chung
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION = exports.PAGINATION = exports.FILE_UPLOAD = exports.DATE_FORMATS = exports.SUPPORTED_CURRENCIES = exports.DEFAULT_CURRENCY = exports.SUPPORTED_LOCALES = exports.DEFAULT_LOCALE = exports.APP_VERSION = exports.APP_NAME = void 0;
/**
 * App Name
 */
exports.APP_NAME = 'Ray Paradis';
/**
 * App Version
 */
exports.APP_VERSION = '1.0.0';
/**
 * Default Locale
 */
exports.DEFAULT_LOCALE = 'vi';
/**
 * Supported Locales
 */
exports.SUPPORTED_LOCALES = ['vi', 'en'];
/**
 * Default Currency
 */
exports.DEFAULT_CURRENCY = 'VND';
/**
 * Supported Currencies
 */
exports.SUPPORTED_CURRENCIES = ['VND', 'USD', 'EUR'];
/**
 * Date Formats
 */
exports.DATE_FORMATS = {
    DATE: 'DD/MM/YYYY',
    DATETIME: 'DD/MM/YYYY HH:mm',
    TIME: 'HH:mm',
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    DISPLAY_DATE: 'dd/MM/yyyy',
    DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
};
/**
 * File Upload
 */
exports.FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
};
/**
 * Pagination Defaults
 */
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};
/**
 * Session/Token
 */
exports.SESSION = {
    TOKEN_KEY: 'access_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    USER_KEY: 'user',
};
