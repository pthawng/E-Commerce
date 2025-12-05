/**
 * API Configuration
 * Cấu hình API dùng chung giữa Frontend và Back Office
 */
/**
 * Default API Base URL
 */
export declare const DEFAULT_API_BASE_URL = "http://localhost:4000";
/**
 * Configure API base URL at runtime (e.g., from Vite or Next env)
 */
export declare function configureApiBaseUrl(url?: string | null): void;
/**
 * Get API Base URL from environment/runtime config
 */
export declare function getApiBaseUrl(): string;
/**
 * API Base URL snapshot (kept for backwards compatibility)
 */
export declare let API_BASE_URL: string;
/**
 * API Endpoints
 * Các endpoint paths dùng chung
 */
export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/api/auth/login";
        readonly REGISTER: "/api/auth/register";
        readonly REFRESH: "/api/auth/refresh";
        readonly LOGOUT: "/api/auth/logout";
        readonly FORGOT_PASSWORD: "/api/auth/forgot-password";
        readonly RESET_PASSWORD: "/api/auth/reset-password";
        readonly VERIFY_EMAIL: "/api/auth/verify-email";
        readonly CHANGE_PASSWORD: "/api/auth/change-password";
    };
    readonly USERS: {
        readonly BASE: "/api/users";
        readonly ME: "/api/users/me";
        readonly BY_ID: (id: string) => string;
    };
    readonly PRODUCTS: {
        readonly BASE: "/api/products";
        readonly BY_ID: (id: string) => string;
        readonly BY_SLUG: (slug: string) => string;
        readonly SEARCH: "/api/products/search";
    };
    readonly CATEGORIES: {
        readonly BASE: "/api/categories";
        readonly BY_ID: (id: string) => string;
        readonly BY_SLUG: (slug: string) => string;
    };
    readonly ORDERS: {
        readonly BASE: "/api/orders";
        readonly BY_ID: (id: string) => string;
        readonly BY_CODE: (code: string) => string;
        readonly MY_ORDERS: "/api/orders/my";
    };
    readonly CART: {
        readonly BASE: "/api/cart";
        readonly ITEMS: "/api/cart/items";
        readonly CLEAR: "/api/cart/clear";
    };
    readonly DISCOUNTS: {
        readonly BASE: "/api/discounts";
        readonly BY_CODE: (code: string) => string;
        readonly VALIDATE: "/api/discounts/validate";
    };
    readonly REVIEWS: {
        readonly BASE: "/api/reviews";
        readonly BY_ID: (id: string) => string;
        readonly BY_PRODUCT: (productId: string) => string;
    };
};
/**
 * Build full API URL
 * @param path - API path (có thể là từ API_ENDPOINTS hoặc custom path)
 */
export declare function buildApiUrl(path: string): string;
//# sourceMappingURL=api.config.d.ts.map