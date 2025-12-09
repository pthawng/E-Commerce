/**
 * String Helper Utilities
 * Các hàm xử lý string dùng trong backend
 */

/**
 * Generate slug from string
 * Chuyển đổi chuỗi thành slug URL-friendly
 *
 * @param str - String cần convert
 * @returns Slug string (ví dụ: "ao-thun-nam")
 *
 * @example
 * slugify("Áo Thun Nam") // "ao-thun-nam"
 * slugify("Product Name 123") // "product-name-123"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD') // Chuyển về dạng không dấu
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu (diacritics)
    .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
    .replace(/[\s_-]+/g, '-') // Thay spaces/underscores bằng dấu gạch ngang
    .replace(/^-+|-+$/g, ''); // Xóa dấu gạch ngang ở đầu và cuối
}
