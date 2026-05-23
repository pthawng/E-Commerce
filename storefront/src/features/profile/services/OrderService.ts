import { apiGet } from '@/services/apiClient';
import { Order } from '../types';
import { API_ENDPOINTS } from '@shared';

export interface PaginatedOrders {
  items: Order[];
  data: Order[];
  meta: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor: string | null;
  };
}

export class OrderService {
  static async getOrders() {
    // Backend returns paginated response: { items, data, meta }
    return apiGet<PaginatedOrders>(API_ENDPOINTS.ORDERS.BASE);
  }

  static async getOrderDetail(id: string) {
    // Backend API is GET /api/orders/:id
    return apiGet<Order>(API_ENDPOINTS.ORDERS.BY_ID(id));
  }
}
