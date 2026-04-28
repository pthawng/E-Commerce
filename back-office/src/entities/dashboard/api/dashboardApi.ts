import api from "@/shared/api/apiInstance";
export interface DashboardStats {
  revenue: number;
  ordersToday: number;
  activeOrders: number;
  lowStockItems: number;
  conversionRate: number;
  vaultLiquidity?: number;
  atelierLoad?: number;
  pipelineCycle?: number;
  totalAUM?: number;
}
export interface RevenuePoint {
  date: string;
  amount: number;
}
export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/admin/dashboard/stats");
    return response.data;
  },
  getRevenue: async (range: string = "7d"): Promise<RevenuePoint[]> => {
    const response = await api.get(`/admin/dashboard/revenue?range=${range}`);
    return response.data;
  },
  getTopProducts: async (limit: number = 5): Promise<TopProduct[]> => {
    const response = await api.get(
      `/admin/dashboard/top-products?limit=${limit}`,
    );
    return response.data;
  },
  getRecentOrders: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get(
      `/admin/dashboard/recent-orders?limit=${limit}`,
    );
    return response.data;
  },
  getLowStock: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get(`/admin/dashboard/low-stock?limit=${limit}`);
    return response.data;
  },
};
