/**
 * App Configuration
 * Cấu hình ứng dụng dùng chung
 */
/**
 * App Name
 */
export declare const APP_NAME = "Ray Paradis";
/**
 * App Version
 */
export declare const APP_VERSION = "1.0.0";
/**
 * Default Locale
 */
export declare const DEFAULT_LOCALE = "vi";
/**
 * Supported Locales
 */
export declare const SUPPORTED_LOCALES: readonly ["vi", "en"];
/**
 * Default Currency
 */
export declare const DEFAULT_CURRENCY = "VND";
/**
 * Supported Currencies
 */
export declare const SUPPORTED_CURRENCIES: readonly ["VND", "USD", "EUR"];
/**
 * Date Formats
 */
export declare const DATE_FORMATS: {
    readonly DATE: "DD/MM/YYYY";
    readonly DATETIME: "DD/MM/YYYY HH:mm";
    readonly TIME: "HH:mm";
    readonly ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ";
    readonly DISPLAY_DATE: "dd/MM/yyyy";
    readonly DISPLAY_DATETIME: "dd/MM/yyyy HH:mm";
};
/**
 * File Upload
 */
export declare const FILE_UPLOAD: {
    readonly MAX_SIZE: number;
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp", "image/gif"];
    readonly ALLOWED_DOCUMENT_TYPES: readonly ["application/pdf", "application/msword"];
};
/**
 * Pagination Defaults
 */
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly PAGE_SIZE_OPTIONS: readonly [10, 20, 50, 100];
};
/**
 * Session/Token
 */
export declare const SESSION: {
    readonly TOKEN_KEY: "access_token";
    readonly REFRESH_TOKEN_KEY: "refresh_token";
    readonly USER_KEY: "user";
};
//# sourceMappingURL=app.config.d.ts.map