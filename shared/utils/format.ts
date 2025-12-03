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
export function formatCurrency(
  amount: number,
  currency: string = 'VND',
  locale: string = 'vi-VN',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'VND' ? 0 : 2,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(amount);
}

/**
 * Format number
 * @param num - Số cần format
 * @param locale - Locale (mặc định: vi-VN)
 */
export function formatNumber(num: number, locale: string = 'vi-VN'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format date
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 * @param options - Intl.DateTimeFormatOptions
 */
export function formatDate(
  date: Date | string,
  locale: string = 'vi-VN',
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format datetime
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 */
export function formatDateTime(
  date: Date | string,
  locale: string = 'vi-VN',
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 giờ trước")
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = 'vi-VN',
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

