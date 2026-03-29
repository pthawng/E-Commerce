/**
 * API Configuration
 * Refactored for universal compatibility across Vite, Browser, and Node environments.
 */

// Extend global types for Vite environment variable support
declare global {
  interface ImportMeta {
    readonly env: Record<string, string | undefined>;
  }
}

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

/**
 * Senior Environment Resolver
 * Safely resolves environment variables across different runtimes without triggering 
 * syntax errors in CommonJS or browser environments.
 */
function getEnvVar(key: string): string | undefined {
  // 1. Try Node.js process.env
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  // 2. Try globalThis (Browser/Cloudflare/etc)
  if (typeof globalThis !== 'undefined') {
    const globalObj = globalThis as Record<string, any>;
    
    // Check direct global properties
    if (globalObj[key]) return globalObj[key];

    // Check common environment container names
    if (globalObj.process?.env?.[key]) return globalObj.process.env[key];

    // 3. Try Vite/ESM import.meta.env
    // We use dynamic property access to bypass TypeScript/Compiler syntax checks
    // intended for CommonJS modules.
    try {
      // Cast to any to avoid strict syntax checking of import.meta
      const meta = (globalThis as any).import?.meta ?? (globalThis as any).meta;
      if (meta?.env?.[key]) return meta.env[key];
      
      // Fallback to direct import.meta access with @ts-ignore if previous attempt failed
      // This allows Vite/Webpack to perform literal substitution if they are the bundler.
      // @ts-ignore - Parser might complain in CJS, but it is safe at runtime in ESM
      const metaEnv = (import.meta as any)?.env;
      if (metaEnv?.[key]) return metaEnv[key];
    } catch {
      // Ignore resolution errors
    }
  }

  return undefined;
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

/**
 * Configure API base URL at runtime (e.g., from Vite or Next entry point)
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
    normalizeUrl(getEnvVar('VITE_API_BASE_URL')) ??
    normalizeUrl(getEnvVar('VITE_API_URL')) ??
    normalizeUrl(getEnvVar('NEXT_PUBLIC_API_URL')) ??
    normalizeUrl(getEnvVar('API_URL')) ??
    normalizeUrl(getEnvVar('BACKEND_URL')) ??
    DEFAULT_API_BASE_URL
  );
}

/**
 * API Base URL snapshot (maintained for backward compatibility)
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
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    RESET_PASSWORD_VERIFY: '/api/auth/reset-password/verify',
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
    VALIDATE_CHECKOUT: '/api/checkout/validate',
    INITIATE_PAYMENT: '/api/payments/initiate',
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

  // Payments
  PAYMENTS: {
    BASE: '/api/payment',
    CREATE: '/api/payment/create',
    STATUS: (id: string) => `/api/payment/status/${id}`,
    REFUND: (id: string) => `/api/payment/refund/${id}`,
    VIETQR_WEBHOOK: '/api/payment/vietqr/webhook',
    VIETQR_CONFIRM: '/api/payment/vietqr/confirm',
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

