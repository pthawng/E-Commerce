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
let config = resolveAppConfig();

export let API_BASE_URL = config.apiBaseUrl;
export const NODE_ENV = config.nodeEnv;

/**
 * Configure API Base URL manually
 * Used to force a specific URL from the outside (e.g., main.tsx)
 */
export function configureApiBaseUrl(url: string | undefined): void {
  if (url) {
    API_BASE_URL = url;
    config.apiBaseUrl = url;
  }
}

/**
 * Get current API Base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * API Endpoints
 * Shared endpoint paths
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
    RESEND_VERIFY: '/api/auth/resend-verification',
    GUEST_VERIFY_REQUEST: '/api/auth/guest/verify-request',
    GUEST_VERIFY_CONFIRM: '/api/auth/guest/verify-confirm',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },

  // Admin Auth
  ADMIN: {
    AUTH: {
      LOGIN: '/api/admin/auth/login',
    },
  },

  BACK_OFFICE: {
    AUTH: {
      LOGIN: '/api/back-office/auth/login',
      GOOGLE: '/api/back-office/auth/google',
      VERIFY_MFA: '/api/back-office/auth/verify-mfa',
      RECOVERY_CODE: '/api/back-office/auth/recovery-code',
      LOGOUT: '/api/back-office/auth/logout',
      ME: '/api/back-office/auth/me',
      MFA_SETUP: '/api/back-office/auth/mfa/setup',
      MFA_VERIFY_SETUP: '/api/back-office/auth/mfa/verify-setup',
    },
    STAFF: {
      BASE: '/api/back-office/staff',
      AVAILABLE_ROLES: '/api/back-office/staff/roles/available',
      INVITATIONS: '/api/back-office/staff/invitations',
      INVITATION_VERIFY: '/api/back-office/staff/invitations/verify',
      INVITATION_ACCEPT: '/api/back-office/staff/invitations/accept',
      STATUS: (id: string) => `/api/back-office/staff/${id}/status`,
      ROLES: (id: string) => `/api/back-office/staff/${id}/roles`,
    },
    SESSIONS: {
      BASE: '/api/back-office/sessions',
      BY_ID: (id: string) => `/api/back-office/sessions/${id}`,
      BY_STAFF: (staffId: string) => `/api/back-office/sessions/staff/${staffId}`,
    },
    CATALOG: {
      PRODUCTS: '/api/back-office/catalog/products',
      PRODUCT_BY_ID: (id: string) => `/api/back-office/catalog/products/${id}`,
      PRODUCT_STATUS: (id: string) => `/api/back-office/catalog/products/${id}/status`,
      OVERVIEW: '/api/back-office/catalog/overview',
      FILTERS: '/api/back-office/catalog/filters',
      PRICING_FORMULA: '/api/back-office/catalog/pricing-formula',
      IMPORT: '/api/back-office/catalog/import',
    },
    DASHBOARD: {
      STATS: '/api/back-office/dashboard/stats',
      REVENUE: '/api/back-office/dashboard/revenue',
      TOP_PRODUCTS: '/api/back-office/dashboard/top-products',
      RECENT_ORDERS: '/api/back-office/dashboard/recent-orders',
      LOW_STOCK: '/api/back-office/dashboard/low-stock',
    },
    SETTINGS: {
      BASE: '/api/back-office/system/settings',
      REGISTRY: '/api/back-office/system/settings/registry',
    },
  },

  INVENTORY: {
    OVERVIEW: '/api/inventory/overview',
    WAREHOUSES: '/api/inventory/warehouses',
    STOCK: '/api/inventory/stock',
    STOCK_BY_VARIANT: (variantId: string) => `/api/inventory/stock/${variantId}`,
    LOGS: '/api/inventory/logs',
    TRANSFERS: '/api/inventory/transfers',
    TRANSFER_APPROVE: (id: string) => `/api/inventory/transfers/${id}/approve`,
    TRANSFER_REJECT: (id: string) => `/api/inventory/transfers/${id}/reject`,
    TRANSFER_SHIP: (id: string) => `/api/inventory/transfers/${id}/ship`,
    TRANSFER_RECEIVE: (id: string) => `/api/inventory/transfers/${id}/receive`,
    DISCREPANCY_RESOLVE: (id: string) => `/api/inventory/discrepancies/${id}/resolve`,
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

  SYSTEM: {
    CURRENCY_RATES: '/api/system/currency/rates',
  },

  AI: {
    RECOMMENDATIONS: '/api/ai/recommendations',
    SEARCH: '/api/ai/search',
    CHAT: '/api/ai/chat',
  },
} as const;

/**
 * Build full API URL
 * @param path - API path (can be from API_ENDPOINTS or custom path)
 */
export function buildApiUrl(path: string): string {
  const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

