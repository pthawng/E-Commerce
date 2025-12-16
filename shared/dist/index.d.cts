/**
 * Order Status Enum
 * Trạng thái đơn hàng
 */
declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    SHIPPING = "shipping",
    DELIVERED = "delivered",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    RETURNED = "returned",
    REFUNDED = "refunded"
}
/**
 * Payment Status Enum
 * Trạng thái thanh toán
 */
declare enum PaymentStatus {
    UNPAID = "unpaid",
    PARTIALLY_PAID = "partially_paid",
    PAID = "paid",
    REFUNDED = "refunded"
}
/**
 * Transaction Type Enum
 * Loại giao dịch thanh toán
 */
declare enum TransactionType {
    PAYMENT = "payment",
    REFUND = "refund"
}
/**
 * Transaction Status Enum
 * Trạng thái giao dịch
 */
declare enum TransactionStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REVERSED = "reversed"
}

/**
 * Permission Module Enum
 * Module phân quyền
 */
declare enum PermissionModule {
    USER = "USER",
    PRODUCT = "PRODUCT",
    ORDER = "ORDER",
    DISCOUNT = "DISCOUNT",
    CMS = "CMS",
    SYSTEM = "SYSTEM"
}
/**
 * Permission Action Enum
 * Hành động phân quyền
 */
declare enum PermissionAction {
    READ = "READ",
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    MANAGE = "MANAGE"
}

/**
 * Media Type Enum
 * Loại media cho sản phẩm
 */
declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video",
    MODEL_3D = "model_3d"
}
/**
 * Inventory Action Type Enum
 * Loại hành động kho
 */
declare enum ActionType {
    IMPORT = "IMPORT",
    SALE = "SALE",
    RETURN = "RETURN",
    TRANSFER_OUT = "TRANSFER_OUT",
    TRANSFER_IN = "TRANSFER_IN",
    ADJUSTMENT = "ADJUSTMENT"
}

/**
 * API Response Types
 * Chuẩn hóa response format giữa BE và FE
 */
/**
 * Standard API Response
 */
interface ApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message: string;
    path: string;
    timestamp: string;
    data: T | null;
    meta: PaginationMeta | null;
    errors?: any;
}
/**
 * Pagination Meta
 */
interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
/**
 * Paginated Response
 */
interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
}
/**
 * API Error Response
 */
interface ApiError {
    success: false;
    statusCode: number;
    message: string;
    path: string;
    timestamp: string;
    errors?: Array<{
        field?: string;
        message: string;
    }>;
    meta: null;
    data: null;
}
/**
 * Pagination Query Params
 */
interface PaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
}

/**
 * User Types
 * Types cho User entity - dùng chung giữa BE và FE
 */
/**
 * Base User Type
 */
interface User {
    id: string;
    email: string;
    phone?: string;
    fullName?: string;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt?: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    deletedAt?: Date | string;
}
/**
 * User Summary (cho list, không có thông tin nhạy cảm)
 */
interface UserSummary {
    id: string;
    email: string;
    fullName?: string;
    isActive: boolean;
    isEmailVerified: boolean;
}
/**
 * User with Roles
 */
interface UserWithRoles extends User {
    roles?: Role[];
    permissions?: Permission[];
}
/**
 * Role Type
 */
interface Role {
    id: string;
    slug: string;
    name: string;
    description?: string;
    isSystem: boolean;
    createdAt: Date | string;
    updatedAt?: Date | string;
}
/**
 * Permission Type
 */
interface Permission {
    id: string;
    slug: string;
    name: string;
    description?: string;
    module?: string;
    action?: string;
    createdAt: Date | string;
}

/**
 * Auth Types
 * Types cho Authentication - dùng chung giữa BE và FE
 */
/**
 * Login Payload
 */
interface LoginPayload {
    email?: string;
    phone?: string;
    password: string;
}
/**
 * Register Payload
 */
interface RegisterPayload {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
}
/**
 * Auth Tokens
 */
interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
/**
 * Auth Response (includes user + tokens)
 */
interface AuthResponse {
    user: {
        id: string;
        email: string;
        fullName?: string;
        phone?: string;
        isActive: boolean;
        isEmailVerified: boolean;
    };
    tokens: AuthTokens;
}
/**
 * Refresh Token Payload
 */
interface RefreshTokenPayload {
    refreshToken: string;
}
/**
 * Change Password Payload
 */
interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}
/**
 * Forgot Password Payload
 */
interface ForgotPasswordPayload {
    email: string;
}
/**
 * Reset Password Payload
 */
interface ResetPasswordPayload {
    token: string;
    newPassword: string;
}
/**
 * Verify Email Payload
 */
interface VerifyEmailPayload {
    token: string;
}

/**
 * Order Types
 * Types cho Order entity - dùng chung giữa BE và FE
 */

/**
 * Order Item
 */
interface OrderItem {
    id: string;
    orderId: string;
    productVariantId?: string;
    productName: string;
    sku: string;
    variantTitle: any;
    thumbnailUrl?: string;
    quantity: number;
    price: number;
    totalLine: number;
}
/**
 * Order
 */
interface Order {
    id: string;
    code: string;
    userId?: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    shippingAddress: any;
    billingAddress?: any;
    shippingMethodId?: string;
    shippingMethodName?: string;
    trackingCode?: string;
    estimatedDeliveryAt?: Date | string;
    currency: string;
    subTotal: number;
    shippingFee: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    note?: string;
    cancelReason?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    confirmedAt?: Date | string;
    shippedAt?: Date | string;
    deliveredAt?: Date | string;
    completedAt?: Date | string;
    cancelledAt?: Date | string;
    items?: OrderItem[];
}
/**
 * Order Summary (cho list)
 */
interface OrderSummary {
    id: string;
    code: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    itemCount: number;
    createdAt: Date | string;
    customerName?: string;
}

/**
 * Product Types
 * Types cho Product entity - dùng chung giữa BE và FE
 */

/**
 * Product Media
 */
interface ProductMedia {
    id: string;
    productId: string;
    url: string;
    type: MediaType;
    altText?: any;
    isThumbnail: boolean;
    order: number;
    createdAt: Date | string;
}
/**
 * Product Variant
 */
interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    variantTitle?: any;
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
interface Product {
    id: string;
    categoryId?: string;
    name: any;
    slug: string;
    description?: any;
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
interface ProductSummary {
    id: string;
    name: any;
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
interface Category {
    id: string;
    parentId?: string;
    name: any;
    slug: string;
    isActive: boolean;
    order: number;
    path?: string;
    children?: Category[];
}

/**
 * Format Utilities
 * Các hàm format dùng chung giữa BE và FE
 */
/**
 * Format currency
 * @param amount - Số tiền
 * @param currency - Mã tiền tệ (mặc định: VND)
 * @param locale - Locale (mặc định: vi-VN)
 */
declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
/**
 * Format number
 * @param num - Số cần format
 * @param locale - Locale (mặc định: vi-VN)
 */
declare function formatNumber(num: number, locale?: string): string;
/**
 * Format date
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 * @param options - Intl.DateTimeFormatOptions
 */
declare function formatDate(date: Date | string, locale?: string, options?: Intl.DateTimeFormatOptions): string;
/**
 * Format datetime
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 */
declare function formatDateTime(date: Date | string, locale?: string): string;
/**
 * Format relative time (e.g., "2 giờ trước")
 * @param date - Date object hoặc string
 * @param locale - Locale (mặc định: vi-VN)
 */
declare function formatRelativeTime(date: Date | string, locale?: string): string;

/**
 * String Utilities
 * Các hàm xử lý string dùng chung
 */
/**
 * Generate slug from string
 * @param str - String cần convert
 */
declare function slugify(str: string): string;
/**
 * Truncate string
 * @param str - String cần truncate
 * @param length - Độ dài tối đa
 * @param suffix - Suffix (mặc định: '...')
 */
declare function truncate(str: string, length: number, suffix?: string): string;
/**
 * Capitalize first letter
 */
declare function capitalize(str: string): string;
/**
 * Camel case to kebab case
 */
declare function camelToKebab(str: string): string;
/**
 * Kebab case to camel case
 */
declare function kebabToCamel(str: string): string;

/**
 * Order Constants
 * Constants cho Order - labels, configs
 */

/**
 * Order Status Labels (Vietnamese)
 */
declare const ORDER_STATUS_LABELS: Record<OrderStatus, string>;
/**
 * Payment Status Labels (Vietnamese)
 */
declare const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string>;
/**
 * Order Status Colors (for UI)
 */
declare const ORDER_STATUS_COLORS: Record<OrderStatus, string>;
/**
 * Payment Status Colors (for UI)
 */
declare const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string>;

/**
 * Common Constants
 * Re-export từ config để backward compatibility
 * @deprecated Sử dụng từ @shared/config thay vì constants
 */
declare const DEFAULT_PAGE = 1;
declare const DEFAULT_LIMIT = 20;
declare const MAX_LIMIT = 100;

/**
 * API Configuration
 * Cấu hình API dùng chung giữa Frontend và Back Office
 */
/**
 * Default API Base URL
 */
declare const DEFAULT_API_BASE_URL = "http://localhost:4000";
/**
 * Configure API base URL at runtime (e.g., from Vite or Next env)
 */
declare function configureApiBaseUrl(url?: string | null): void;
/**
 * Get API Base URL from environment/runtime config
 */
declare function getApiBaseUrl(): string;
/**
 * API Base URL snapshot (kept for backwards compatibility)
 */
declare let API_BASE_URL: string;
/**
 * API Endpoints
 * Các endpoint paths dùng chung
 */
declare const API_ENDPOINTS: {
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
    readonly ADMIN: {
        readonly AUTH: {
            readonly LOGIN: "/api/admin/auth/login";
        };
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
declare function buildApiUrl(path: string): string;

/**
 * App Configuration
 * Cấu hình ứng dụng dùng chung
 */
/**
 * App Name
 */
declare const APP_NAME = "Ray Paradis";
/**
 * App Version
 */
declare const APP_VERSION = "1.0.0";
/**
 * Default Locale
 */
declare const DEFAULT_LOCALE = "vi";
/**
 * Supported Locales
 */
declare const SUPPORTED_LOCALES: readonly ["vi", "en"];
/**
 * Default Currency
 */
declare const DEFAULT_CURRENCY = "VND";
/**
 * Supported Currencies
 */
declare const SUPPORTED_CURRENCIES: readonly ["VND", "USD", "EUR"];
/**
 * Date Formats
 */
declare const DATE_FORMATS: {
    readonly DATE: "DD/MM/YYYY";
    readonly DATETIME: "DD/MM/YYYY HH:mm";
    readonly TIME: "HH:mm";
    readonly ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ";
    readonly DISPLAY_DATE: "dd/MM/yyyy";
    readonly DISPLAY_DATETIME: "dd/MM/yyyy HH:mm";
};
/**
 * File Upload
 */
declare const FILE_UPLOAD: {
    readonly MAX_SIZE: number;
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp", "image/gif"];
    readonly ALLOWED_DOCUMENT_TYPES: readonly ["application/pdf", "application/msword"];
};
/**
 * Pagination Defaults
 */
declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly PAGE_SIZE_OPTIONS: readonly [10, 20, 50, 100];
};
/**
 * Session/Token
 */
declare const SESSION: {
    readonly TOKEN_KEY: "access_token";
    readonly REFRESH_TOKEN_KEY: "refresh_token";
    readonly USER_KEY: "user";
};

export { API_BASE_URL, API_ENDPOINTS, APP_NAME, APP_VERSION, ActionType, type ApiError, type ApiResponse, type AuthResponse, type AuthTokens, type Category, type ChangePasswordPayload, DATE_FORMATS, DEFAULT_API_BASE_URL, DEFAULT_CURRENCY, DEFAULT_LIMIT, DEFAULT_LOCALE, DEFAULT_PAGE, FILE_UPLOAD, type ForgotPasswordPayload, type LoginPayload, MAX_LIMIT, MediaType, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, type Order, type OrderItem, OrderStatus, type OrderSummary, PAGINATION, PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS, type PaginatedResponse, type PaginationMeta, type PaginationQuery, PaymentStatus, type Permission, PermissionAction, PermissionModule, type Product, type ProductMedia, type ProductSummary, type ProductVariant, type RefreshTokenPayload, type RegisterPayload, type ResetPasswordPayload, type Role, SESSION, SUPPORTED_CURRENCIES, SUPPORTED_LOCALES, TransactionStatus, TransactionType, type User, type UserSummary, type UserWithRoles, type VerifyEmailPayload, buildApiUrl, camelToKebab, capitalize, configureApiBaseUrl, formatCurrency, formatDate, formatDateTime, formatNumber, formatRelativeTime, getApiBaseUrl, kebabToCamel, slugify, truncate };
