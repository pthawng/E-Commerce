// src/enums/order.enum.ts
var OrderStatus = /* @__PURE__ */ ((OrderStatus2) => {
  OrderStatus2["PENDING"] = "pending";
  OrderStatus2["CONFIRMED"] = "confirmed";
  OrderStatus2["PROCESSING"] = "processing";
  OrderStatus2["SHIPPING"] = "shipping";
  OrderStatus2["DELIVERED"] = "delivered";
  OrderStatus2["COMPLETED"] = "completed";
  OrderStatus2["CANCELLED"] = "cancelled";
  OrderStatus2["RETURNED"] = "returned";
  OrderStatus2["REFUNDED"] = "refunded";
  return OrderStatus2;
})(OrderStatus || {});
var PaymentStatus = /* @__PURE__ */ ((PaymentStatus2) => {
  PaymentStatus2["UNPAID"] = "unpaid";
  PaymentStatus2["PARTIALLY_PAID"] = "partially_paid";
  PaymentStatus2["PAID"] = "paid";
  PaymentStatus2["REFUNDED"] = "refunded";
  return PaymentStatus2;
})(PaymentStatus || {});
var TransactionType = /* @__PURE__ */ ((TransactionType2) => {
  TransactionType2["PAYMENT"] = "payment";
  TransactionType2["REFUND"] = "refund";
  return TransactionType2;
})(TransactionType || {});
var TransactionStatus = /* @__PURE__ */ ((TransactionStatus2) => {
  TransactionStatus2["PENDING"] = "pending";
  TransactionStatus2["SUCCESS"] = "success";
  TransactionStatus2["FAILED"] = "failed";
  TransactionStatus2["REVERSED"] = "reversed";
  return TransactionStatus2;
})(TransactionStatus || {});

// src/enums/rbac.enum.ts
var PermissionModule = /* @__PURE__ */ ((PermissionModule2) => {
  PermissionModule2["USER"] = "USER";
  PermissionModule2["PRODUCT"] = "PRODUCT";
  PermissionModule2["ORDER"] = "ORDER";
  PermissionModule2["DISCOUNT"] = "DISCOUNT";
  PermissionModule2["CMS"] = "CMS";
  PermissionModule2["SYSTEM"] = "SYSTEM";
  return PermissionModule2;
})(PermissionModule || {});
var PermissionAction = /* @__PURE__ */ ((PermissionAction2) => {
  PermissionAction2["READ"] = "READ";
  PermissionAction2["CREATE"] = "CREATE";
  PermissionAction2["UPDATE"] = "UPDATE";
  PermissionAction2["DELETE"] = "DELETE";
  PermissionAction2["MANAGE"] = "MANAGE";
  return PermissionAction2;
})(PermissionAction || {});

// src/enums/product.enum.ts
var MediaType = /* @__PURE__ */ ((MediaType2) => {
  MediaType2["IMAGE"] = "image";
  MediaType2["VIDEO"] = "video";
  MediaType2["MODEL_3D"] = "model_3d";
  return MediaType2;
})(MediaType || {});
var ActionType = /* @__PURE__ */ ((ActionType2) => {
  ActionType2["IMPORT"] = "IMPORT";
  ActionType2["SALE"] = "SALE";
  ActionType2["RETURN"] = "RETURN";
  ActionType2["TRANSFER_OUT"] = "TRANSFER_OUT";
  ActionType2["TRANSFER_IN"] = "TRANSFER_IN";
  ActionType2["ADJUSTMENT"] = "ADJUSTMENT";
  return ActionType2;
})(ActionType || {});

// src/utils/format.ts
function formatCurrency(amount, currency = "VND", locale = "vi-VN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "VND" ? 0 : 2,
    maximumFractionDigits: currency === "VND" ? 0 : 2
  }).format(amount);
}
function formatNumber(num, locale = "vi-VN") {
  return new Intl.NumberFormat(locale).format(num);
}
function formatDate(date, locale = "vi-VN", options) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const defaultOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}
function formatDateTime(date, locale = "vi-VN") {
  return formatDate(date, locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatRelativeTime(date, locale = "vi-VN") {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1e3);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, "second");
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  } else if (diffInSeconds < 2592e3) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  } else if (diffInSeconds < 31536e3) {
    return rtf.format(-Math.floor(diffInSeconds / 2592e3), "month");
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536e3), "year");
  }
}

// src/utils/string.ts
function slugify(str) {
  return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
function truncate(str, length, suffix = "...") {
  if (str.length <= length) return str;
  return str.slice(0, length) + suffix;
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function camelToKebab(str) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}
function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

// src/constants/order.constants.ts
var ORDER_STATUS_LABELS = {
  ["pending" /* PENDING */]: "Ch\u1EDD x\u1EED l\xFD",
  ["confirmed" /* CONFIRMED */]: "\u0110\xE3 x\xE1c nh\u1EADn",
  ["processing" /* PROCESSING */]: "\u0110ang x\u1EED l\xFD",
  ["shipping" /* SHIPPING */]: "\u0110ang giao h\xE0ng",
  ["delivered" /* DELIVERED */]: "\u0110\xE3 giao h\xE0ng",
  ["completed" /* COMPLETED */]: "Ho\xE0n th\xE0nh",
  ["cancelled" /* CANCELLED */]: "\u0110\xE3 h\u1EE7y",
  ["returned" /* RETURNED */]: "\u0110\xE3 tr\u1EA3 h\xE0ng",
  ["refunded" /* REFUNDED */]: "\u0110\xE3 ho\xE0n ti\u1EC1n"
};
var PAYMENT_STATUS_LABELS = {
  ["unpaid" /* UNPAID */]: "Ch\u01B0a thanh to\xE1n",
  ["partially_paid" /* PARTIALLY_PAID */]: "Thanh to\xE1n m\u1ED9t ph\u1EA7n",
  ["paid" /* PAID */]: "\u0110\xE3 thanh to\xE1n",
  ["refunded" /* REFUNDED */]: "\u0110\xE3 ho\xE0n ti\u1EC1n"
};
var ORDER_STATUS_COLORS = {
  ["pending" /* PENDING */]: "yellow",
  ["confirmed" /* CONFIRMED */]: "blue",
  ["processing" /* PROCESSING */]: "purple",
  ["shipping" /* SHIPPING */]: "indigo",
  ["delivered" /* DELIVERED */]: "green",
  ["completed" /* COMPLETED */]: "green",
  ["cancelled" /* CANCELLED */]: "red",
  ["returned" /* RETURNED */]: "orange",
  ["refunded" /* REFUNDED */]: "gray"
};
var PAYMENT_STATUS_COLORS = {
  ["unpaid" /* UNPAID */]: "red",
  ["partially_paid" /* PARTIALLY_PAID */]: "yellow",
  ["paid" /* PAID */]: "green",
  ["refunded" /* REFUNDED */]: "gray"
};

// src/constants/common.constants.ts
var DEFAULT_PAGE = 1;
var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;

// src/config/api.config.ts
var GLOBAL_API_BASE_URL_KEY = "__APP_API_BASE_URL__";
var runtimeApiBaseUrl;
var DEFAULT_API_BASE_URL = "http://localhost:4000";
function normalizeUrl(value) {
  if (!value) return void 0;
  const trimmed = value.trim();
  if (!trimmed) return void 0;
  return trimmed.replace(/\/$/, "");
}
function resolveGlobalApiBaseUrl() {
  if (typeof globalThis === "undefined") return void 0;
  const globalObj = globalThis;
  return normalizeUrl(
    runtimeApiBaseUrl ?? globalObj[GLOBAL_API_BASE_URL_KEY] ?? globalObj.__APP_API_BASE_URL__ ?? globalObj.__VITE_API_URL__ ?? globalObj.__NEXT_PUBLIC_API_URL__ ?? globalObj.API_BASE_URL
  );
}
function resolveProcessEnvApiUrl() {
  if (typeof process === "undefined") return void 0;
  return normalizeUrl(
    process.env?.NEXT_PUBLIC_API_URL ?? process.env?.VITE_API_URL ?? process.env?.API_URL ?? process.env?.BACKEND_URL
  );
}
function configureApiBaseUrl(url) {
  runtimeApiBaseUrl = normalizeUrl(url);
  if (typeof globalThis !== "undefined") {
    globalThis[GLOBAL_API_BASE_URL_KEY] = runtimeApiBaseUrl;
  }
  API_BASE_URL = getApiBaseUrl();
}
function getApiBaseUrl() {
  return runtimeApiBaseUrl ?? resolveGlobalApiBaseUrl() ?? resolveProcessEnvApiUrl() ?? DEFAULT_API_BASE_URL;
}
var API_BASE_URL = getApiBaseUrl();
var API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    VERIFY_EMAIL: "/api/auth/verify-email",
    CHANGE_PASSWORD: "/api/auth/change-password"
  },
  // Admin Auth
  ADMIN: {
    AUTH: {
      LOGIN: "/api/admin/auth/login"
    }
  },
  // Users
  USERS: {
    BASE: "/api/users",
    ME: "/api/users/me",
    BY_ID: (id) => `/api/users/${id}`
  },
  // Products
  PRODUCTS: {
    BASE: "/api/products",
    BY_ID: (id) => `/api/products/${id}`,
    BY_SLUG: (slug) => `/api/products/slug/${slug}`,
    SEARCH: "/api/products/search"
  },
  // Categories
  CATEGORIES: {
    BASE: "/api/categories",
    BY_ID: (id) => `/api/categories/${id}`,
    BY_SLUG: (slug) => `/api/categories/slug/${slug}`
  },
  // Orders
  ORDERS: {
    BASE: "/api/orders",
    BY_ID: (id) => `/api/orders/${id}`,
    BY_CODE: (code) => `/api/orders/code/${code}`,
    MY_ORDERS: "/api/orders/my"
  },
  // Cart
  CART: {
    BASE: "/api/cart",
    ITEMS: "/api/cart/items",
    CLEAR: "/api/cart/clear"
  },
  // Discounts
  DISCOUNTS: {
    BASE: "/api/discounts",
    BY_CODE: (code) => `/api/discounts/code/${code}`,
    VALIDATE: "/api/discounts/validate"
  },
  // Reviews
  REVIEWS: {
    BASE: "/api/reviews",
    BY_ID: (id) => `/api/reviews/${id}`,
    BY_PRODUCT: (productId) => `/api/reviews/product/${productId}`
  }
};
function buildApiUrl(path) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const apiPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

// src/config/app.config.ts
var APP_NAME = "Ray Paradis";
var APP_VERSION = "1.0.0";
var DEFAULT_LOCALE = "vi";
var SUPPORTED_LOCALES = ["vi", "en"];
var DEFAULT_CURRENCY = "VND";
var SUPPORTED_CURRENCIES = ["VND", "USD", "EUR"];
var DATE_FORMATS = {
  DATE: "DD/MM/YYYY",
  DATETIME: "DD/MM/YYYY HH:mm",
  TIME: "HH:mm",
  ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  DISPLAY_DATE: "dd/MM/yyyy",
  DISPLAY_DATETIME: "dd/MM/yyyy HH:mm"
};
var FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "application/msword"]
};
var PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};
var SESSION = {
  TOKEN_KEY: "access_token",
  REFRESH_TOKEN_KEY: "refresh_token",
  USER_KEY: "user"
};

export { API_BASE_URL, API_ENDPOINTS, APP_NAME, APP_VERSION, ActionType, DATE_FORMATS, DEFAULT_API_BASE_URL, DEFAULT_CURRENCY, DEFAULT_LIMIT, DEFAULT_LOCALE, DEFAULT_PAGE, FILE_UPLOAD, MAX_LIMIT, MediaType, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, OrderStatus, PAGINATION, PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS, PaymentStatus, PermissionAction, PermissionModule, SESSION, SUPPORTED_CURRENCIES, SUPPORTED_LOCALES, TransactionStatus, TransactionType, buildApiUrl, camelToKebab, capitalize, configureApiBaseUrl, formatCurrency, formatDate, formatDateTime, formatNumber, formatRelativeTime, getApiBaseUrl, kebabToCamel, slugify, truncate };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map