/**
 * String Helper Utilities
 * String helper functions used in the backend
 */

/**
 * Generate slug from string
 * Converts a string into a URL-friendly slug
 *
 * @param str - String to convert
 * @returns Slug string (e.g., "ao-thun-nam")
 *
 * @example
 * slugify("Áo Thun Nam") // "ao-thun-nam"
 * slugify("Product Name 123") // "product-name-123"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD') // Decompose combined graphemes to base characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens from the start and end
}
