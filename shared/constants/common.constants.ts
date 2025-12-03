/**
 * Common Constants
 * Re-export từ config để backward compatibility
 * @deprecated Sử dụng từ @shared/config thay vì constants
 */

// Re-export pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Re-export currency (giữ lại để backward compatibility)
export const DEFAULT_CURRENCY = 'VND';
export const SUPPORTED_CURRENCIES = ['VND', 'USD', 'EUR'] as const;

