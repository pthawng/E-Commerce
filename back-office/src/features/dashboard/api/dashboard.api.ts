import { backOfficeJson } from "@/lib/back-office-api";
import { API_ENDPOINTS } from "@shared";

export type DashboardStats = {
  revenue: number;
  ordersToday: number;
  activeOrders: number;
  lowStockItems: number;
  conversionRate: number;
};

export type DashboardRevenuePoint = {
  date: string;
  amount: number;
};

export type DashboardRecentOrder = {
  id: string;
  code: string;
  status: string;
  paymentStatus?: string | null;
  totalAmount: number | string;
  createdAt: string;
  workloadFactor?: number;
  slaStatus?: string;
  user?: {
    fullName?: string | null;
    email?: string | null;
  } | null;
  items?: Array<{ quantity: number }>;
};

export type DashboardLowStockAlert = {
  id: string;
  quantity: number;
  reservedQuantity: number;
  warehouse?: {
    name?: string;
    code?: string;
  };
  productVariant?: {
    sku?: string;
    variantTitle?: unknown;
    product?: {
      name?: unknown;
    };
  };
};

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) qs.set(key, String(value));
  });
  const query = qs.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

export const dashboardApi = {
  stats() {
    return backOfficeJson<DashboardStats>(API_ENDPOINTS.BACK_OFFICE.DASHBOARD.STATS);
  },
  revenue(range: "7d" | "30d" = "7d") {
    return backOfficeJson<DashboardRevenuePoint[]>(
      withQuery(API_ENDPOINTS.BACK_OFFICE.DASHBOARD.REVENUE, { range }),
    );
  },
  recentOrders(limit = 8) {
    return backOfficeJson<DashboardRecentOrder[]>(
      withQuery(API_ENDPOINTS.BACK_OFFICE.DASHBOARD.RECENT_ORDERS, { limit }),
    );
  },
  lowStock(limit = 8) {
    return backOfficeJson<DashboardLowStockAlert[]>(
      withQuery(API_ENDPOINTS.BACK_OFFICE.DASHBOARD.LOW_STOCK, { limit }),
    );
  },
};
