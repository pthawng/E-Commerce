/**
 * String Utilities
 * Các hàm xử lý string dùng chung
 */
/**
 * Generate slug from string
 * @param str - String cần convert
 */
export declare function slugify(str: string): string;
/**
 * Truncate string
 * @param str - String cần truncate
 * @param length - Độ dài tối đa
 * @param suffix - Suffix (mặc định: '...')
 */
export declare function truncate(str: string, length: number, suffix?: string): string;
/**
 * Capitalize first letter
 */
export declare function capitalize(str: string): string;
/**
 * Camel case to kebab case
 */
export declare function camelToKebab(str: string): string;
/**
 * Kebab case to camel case
 */
export declare function kebabToCamel(str: string): string;
//# sourceMappingURL=string.d.ts.map