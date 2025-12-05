"use strict";
/**
 * String Utilities
 * Các hàm xử lý string dùng chung
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.truncate = truncate;
exports.capitalize = capitalize;
exports.camelToKebab = camelToKebab;
exports.kebabToCamel = kebabToCamel;
/**
 * Generate slug from string
 * @param str - String cần convert
 */
function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
/**
 * Truncate string
 * @param str - String cần truncate
 * @param length - Độ dài tối đa
 * @param suffix - Suffix (mặc định: '...')
 */
function truncate(str, length, suffix = '...') {
    if (str.length <= length)
        return str;
    return str.slice(0, length) + suffix;
}
/**
 * Capitalize first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
/**
 * Camel case to kebab case
 */
function camelToKebab(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}
/**
 * Kebab case to camel case
 */
function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
