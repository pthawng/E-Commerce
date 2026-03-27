import { apiGet } from '@/services/apiClient';
import { Order } from '../types';
import { API_ENDPOINTS } from '@shared';

export class OrderService {
  static async getOrders() {
    // Backend API is GET /api/orders
    return apiGet<Order[]>(API_ENDPOINTS.ORDERS.BASE);
  }

  static async getOrderDetail(id: string) {
    // Backend API is GET /api/orders/:id
    return apiGet<Order>(API_ENDPOINTS.ORDERS.BY_ID(id));
  }
}
