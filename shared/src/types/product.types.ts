/**
 * Product Types
 * Types cho Product entity - dùng chung giữa BE và FE
 */

import { MediaType } from '../enums';

/**
 * Standard Multilingual field structure
 */
export interface Multilingual {
  vi: string;
  en: string;
}

/**
 * Product Media
 */
export interface ProductMedia {
  id: string;
  productId: string;
  url: string;
  type: MediaType;
  altText?: Multilingual; // JSON field
  isThumbnail: boolean;
  order: number;
  createdAt: Date | string;
}

/**
 * Product Variant
 */
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  variantTitle?: Multilingual; // JSON field
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  weightGram?: number;
  isDefault: boolean;
  isActive: boolean;
  position: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Product
 */
export interface Product {
  id: string;
  categoryId?: string;
  name: Multilingual; // JSON field (multilingual)
  slug: string;
  description?: Multilingual; // JSON field
  displayPriceMin?: number;
  displayPriceMax?: number;
  hasVariants: boolean;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  variants?: ProductVariant[];
  media?: ProductMedia[];
}

/**
 * Product Summary (cho list)
 */
export interface ProductSummary {
  id: string;
  name: Multilingual; // JSON field
  slug: string;
  displayPriceMin?: number;
  displayPriceMax?: number;
  thumbnailUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
}

/**
 * Category
 */
export interface Category {
  id: string;
  parentId?: string;
  name: Multilingual; // JSON field
  slug: string;
  isActive: boolean;
  order: number;
  path?: string;
  children?: Category[];
}

