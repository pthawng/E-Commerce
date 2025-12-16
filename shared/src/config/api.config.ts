/**
 * API Configuration
 * Cấu hình API dùng chung giữa Frontend và Back Office
 */

/**
 * API base URL runtime configuration
 */
const GLOBAL_API_BASE_URL_KEY = '__APP_API_BASE_URL__';
let runtimeApiBaseUrl: string | undefined;

/**
 * Default API Base URL
 */
export const DEFAULT_API_BASE_URL = 'http://localhost:4000';

/**
 * Normalize a URL string (trim + remove trailing slash)
 */
function normalizeUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/$/, '');
}

function resolveGlobalApiBaseUrl(): string | undefined {
  if (typeof globalThis === 'undefined') return undefined;
  const globalObj = globalThis as Record<string, any>;
  return normalizeUrl(
    runtimeApiBaseUrl ??
    globalObj[GLOBAL_API_BASE_URL_KEY] ??
    globalObj.__APP_API_BASE_URL__ ??
    globalObj.__VITE_API_URL__ ??
    globalObj.__NEXT_PUBLIC_API_URL__ ??
    globalObj.API_BASE_URL,
  );
}

function resolveProcessEnvApiUrl(): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return normalizeUrl(
    process.env?.NEXT_PUBLIC_API_URL ??
    process.env?.VITE_API_URL ??
    process.env?.API_URL ??
    process.env?.BACKEND_URL,
  );
}

/**
 * Configure API base URL at runtime (e.g., from Vite or Next env)
 */
export function configureApiBaseUrl(url?: string | null) {
  runtimeApiBaseUrl = normalizeUrl(url);

  if (typeof globalThis !== 'undefined') {
    (globalThis as Record<string, any>)[GLOBAL_API_BASE_URL_KEY] = runtimeApiBaseUrl;
  }

  API_BASE_URL = getApiBaseUrl();
}

/**
 * Get API Base URL from environment/runtime config
 */
export function getApiBaseUrl(): string {
  return (
    runtimeApiBaseUrl ??
    resolveGlobalApiBaseUrl() ??
    resolveProcessEnvApiUrl() ??
    DEFAULT_API_BASE_URL
  );
}

/**
 * API Base URL snapshot (kept for backwards compatibility)
 */
export let API_BASE_URL = getApiBaseUrl();

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

  // Admin Auth
  ADMIN: {
    AUTH: {
      LOGIN: '/api/admin/auth/login',
    },
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
  const baseUrl = getApiBaseUrl().replace(/\/$/, ''); // Remove trailing slash
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

