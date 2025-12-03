/**
 * API Configuration
 * Cấu hình API dùng chung giữa Frontend và Back Office
 */

/**
 * Get API Base URL from environment variable
 * Hỗ trợ cả Next.js (NEXT_PUBLIC_API_URL) và Vite (VITE_API_URL)
 */
export function getApiBaseUrl(): string {
  // Next.js environment variable
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Vite environment variable
  if (typeof import.meta !== 'undefined') {
    const viteEnv = (import.meta as any).env;
    if (viteEnv?.VITE_API_URL) {
      return viteEnv.VITE_API_URL;
    }
  }
  
  // Fallback default
  return 'http://localhost:4000';
}

/**
 * Default API Base URL
 */
export const DEFAULT_API_BASE_URL = 'http://localhost:4000';

/**
 * API Base URL (computed)
 * Sử dụng function để có thể access được trong cả Next.js và Vite
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * API Endpoints
 * Các endpoint paths dùng chung
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  
  // Users
  USERS: {
    BASE: '/api/users',
    ME: '/api/users/me',
    BY_ID: (id: string) => `/api/users/${id}`,
  },
  
  // Products
  PRODUCTS: {
    BASE: '/api/products',
    BY_ID: (id: string) => `/api/products/${id}`,
    BY_SLUG: (slug: string) => `/api/products/slug/${slug}`,
    SEARCH: '/api/products/search',
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/api/categories',
    BY_ID: (id: string) => `/api/categories/${id}`,
    BY_SLUG: (slug: string) => `/api/categories/slug/${slug}`,
  },
  
  // Orders
  ORDERS: {
    BASE: '/api/orders',
    BY_ID: (id: string) => `/api/orders/${id}`,
    BY_CODE: (code: string) => `/api/orders/code/${code}`,
    MY_ORDERS: '/api/orders/my',
  },
  
  // Cart
  CART: {
    BASE: '/api/cart',
    ITEMS: '/api/cart/items',
    CLEAR: '/api/cart/clear',
  },
  
  // Discounts
  DISCOUNTS: {
    BASE: '/api/discounts',
    BY_CODE: (code: string) => `/api/discounts/code/${code}`,
    VALIDATE: '/api/discounts/validate',
  },
  
  // Reviews
  REVIEWS: {
    BASE: '/api/reviews',
    BY_ID: (id: string) => `/api/reviews/${id}`,
    BY_PRODUCT: (productId: string) => `/api/reviews/product/${productId}`,
  },
} as const;

/**
 * Build full API URL
 * @param path - API path (có thể là từ API_ENDPOINTS hoặc custom path)
 */
export function buildApiUrl(path: string): string {
  const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

