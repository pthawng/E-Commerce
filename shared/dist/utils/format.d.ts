/**
 * Format Utilities
 * Các hàm format dùng chung giữa BE và FE
 */
/**
 * Format currency
 * @param amount - Số tiền
 * @param currency - Mã tiền tệ (mặc định: VND)
 * @param locale - Locale (mặc định: vi-VN)
 */
export declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
/**
 * Format number
 * @param num - Số cần format
 * @param locale - Locale (mặc định: vi-VN)
 */
export declare function formatNumber(num: number, locale?: string): string;
/**
 * Format date
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 * @param options - Intl.DateTimeFormatOptions
 */
export declare function formatDate(date: Date | string, locale?: string, options?: Intl.DateTimeFormatOptions): string;
/**
 * Format datetime
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 */
export declare function formatDateTime(date: Date | string, locale?: string): string;
/**
 * Format relative time (e.g., "2 giờ trước")
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 */
export declare function formatRelativeTime(date: Date | string, locale?: string): string;
//# sourceMappingURL=format.d.ts.map