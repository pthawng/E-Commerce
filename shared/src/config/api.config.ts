/**
 * API Configuration
 * Refactored for universal compatibility across Vite, Browser, and Node environments.
 */
import { AppConfig } from './config.contract';

/**
 * Senior Environment Resolver
 * Safely resolves environment variables across different runtimes.
 */
function getEnvVar(key: string): string | undefined {
  // 1. Try Node.js process.env (Backend)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  // 2. Try Vite/ESM import.meta.env (Frontend)
  try {
    // @ts-ignore
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.[key]) return metaEnv[key];
  } catch {
    // Ignore resolution errors if not in ESM/Vite
  }

  // 3. Global fallback
  if (typeof globalThis !== 'undefined') {
    return (globalThis as any)[key] || (globalThis as any).process?.env?.[key];
  }

  return undefined;
}

/**
 * Get the current Environment Configuration based on resolved env vars
 */
export function resolveAppConfig(): AppConfig {
  const nodeEnv = (getEnvVar('NODE_ENV') || getEnvVar('VITE_USER_NODE_ENV') || 'development') as any;
  
  return {
    nodeEnv,
    apiBaseUrl: 
      getEnvVar('VITE_API_BASE_URL') || 
      getEnvVar('API_BASE_URL') || 
      getEnvVar('BACKEND_URL') || 
      'http://localhost:4000',
    client: {
      url: getEnvVar('VITE_CLIENT_URL') || getEnvVar('FRONTEND_URL') || 'http://localhost:5173',
    }
  };
}

// Global snapshot for easy access
const config = resolveAppConfig();

export const API_BASE_URL = config.apiBaseUrl;
export const NODE_ENV = config.nodeEnv;

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
  const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

