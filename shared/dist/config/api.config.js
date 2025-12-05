"use strict";
/**
 * API Configuration
 * Cấu hình API dùng chung giữa Frontend và Back Office
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ENDPOINTS = exports.API_BASE_URL = exports.DEFAULT_API_BASE_URL = void 0;
exports.configureApiBaseUrl = configureApiBaseUrl;
exports.getApiBaseUrl = getApiBaseUrl;
exports.buildApiUrl = buildApiUrl;
/**
 * API base URL runtime configuration
 */
const GLOBAL_API_BASE_URL_KEY = '__APP_API_BASE_URL__';
let runtimeApiBaseUrl;
/**
 * Default API Base URL
 */
exports.DEFAULT_API_BASE_URL = 'http://localhost:4000';
/**
 * Normalize a URL string (trim + remove trailing slash)
 */
function normalizeUrl(value) {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
    return trimmed.replace(/\/$/, '');
}
function resolveGlobalApiBaseUrl() {
    if (typeof globalThis === 'undefined')
        return undefined;
    const globalObj = globalThis;
    return normalizeUrl(runtimeApiBaseUrl ??
        globalObj[GLOBAL_API_BASE_URL_KEY] ??
        globalObj.__APP_API_BASE_URL__ ??
        globalObj.__VITE_API_URL__ ??
        globalObj.__NEXT_PUBLIC_API_URL__ ??
        globalObj.API_BASE_URL);
}
function resolveProcessEnvApiUrl() {
    if (typeof process === 'undefined')
        return undefined;
    return normalizeUrl(process.env?.NEXT_PUBLIC_API_URL ??
        process.env?.VITE_API_URL ??
        process.env?.API_URL ??
        process.env?.BACKEND_URL);
}
/**
 * Configure API base URL at runtime (e.g., from Vite or Next env)
 */
function configureApiBaseUrl(url) {
    runtimeApiBaseUrl = normalizeUrl(url);
    if (typeof globalThis !== 'undefined') {
        globalThis[GLOBAL_API_BASE_URL_KEY] = runtimeApiBaseUrl;
    }
    exports.API_BASE_URL = getApiBaseUrl();
}
/**
 * Get API Base URL from environment/runtime config
 */
function getApiBaseUrl() {
    return (runtimeApiBaseUrl ??
        resolveGlobalApiBaseUrl() ??
        resolveProcessEnvApiUrl() ??
        exports.DEFAULT_API_BASE_URL);
}
/**
 * API Base URL snapshot (kept for backwards compatibility)
 */
exports.API_BASE_URL = getApiBaseUrl();
/**
 * API Endpoints
 * Các endpoint paths dùng chung
 */
exports.API_ENDPOINTS = {
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
        BY_ID: (id) => `/api/users/${id}`,
    },
    // Products
    PRODUCTS: {
        BASE: '/api/products',
        BY_ID: (id) => `/api/products/${id}`,
        BY_SLUG: (slug) => `/api/products/slug/${slug}`,
        SEARCH: '/api/products/search',
    },
    // Categories
    CATEGORIES: {
        BASE: '/api/categories',
        BY_ID: (id) => `/api/categories/${id}`,
        BY_SLUG: (slug) => `/api/categories/slug/${slug}`,
    },
    // Orders
    ORDERS: {
        BASE: '/api/orders',
        BY_ID: (id) => `/api/orders/${id}`,
        BY_CODE: (code) => `/api/orders/code/${code}`,
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
        BY_CODE: (code) => `/api/discounts/code/${code}`,
        VALIDATE: '/api/discounts/validate',
    },
    // Reviews
    REVIEWS: {
        BASE: '/api/reviews',
        BY_ID: (id) => `/api/reviews/${id}`,
        BY_PRODUCT: (productId) => `/api/reviews/product/${productId}`,
    },
};
/**
 * Build full API URL
 * @param path - API path (có thể là từ API_ENDPOINTS hoặc custom path)
 */
function buildApiUrl(path) {
    const baseUrl = getApiBaseUrl().replace(/\/$/, ''); // Remove trailing slash
    const apiPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${apiPath}`;
}
