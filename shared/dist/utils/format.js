"use strict";
/**
 * Format Utilities
 * Các hàm format dùng chung giữa BE và FE
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.formatNumber = formatNumber;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.formatRelativeTime = formatRelativeTime;
/**
 * Format currency
 * @param amount - Số tiền
 * @param currency - Mã tiền tệ (mặc định: VND)
 * @param locale - Locale (mặc định: vi-VN)
 */
function formatCurrency(amount, currency = 'VND', locale = 'vi-VN') {
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
function formatNumber(num, locale = 'vi-VN') {
    return new Intl.NumberFormat(locale).format(num);
}
/**
 * Format date
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 * @param options - Intl.DateTimeFormatOptions
 */
function formatDate(date, locale = 'vi-VN', options) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions = {
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
function formatDateTime(date, locale = 'vi-VN') {
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
function formatRelativeTime(date, locale = 'vi-VN') {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second');
    }
    else if (diffInSeconds < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    }
    else if (diffInSeconds < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    }
    else if (diffInSeconds < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    }
    else if (diffInSeconds < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    }
    else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
}
