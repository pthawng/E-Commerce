import api from "@/shared/api/apiInstance";
import {
  OrderStatusEnum,
  PaymentStatusEnum,
  LuxurySegment,
} from "@/shared/types/order.types";
export interface OrderListItem {
  id: string;
  code: string;
  totalAmount: number;
  status: OrderStatusEnum;
  paymentStatus: PaymentStatusEnum;
  createdAt: string;
  paymentDeadline?: string;
  user?: { fullName: string; email: string; segment?: LuxurySegment };
  guestEmail?: string;
  guestFullName?: string;
  _count?: { items: number };
}
export interface OrderDetails extends OrderListItem {
  shippingAddress: any;
  stateMetadata: any;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    price: number;
    totalLine: number;
  }>;
  timelines: Array<{
    id: string;
    action: string;
    fromStatus: string;
    toStatus: string;
    description: string;
    createdAt: string;
    actorType: string;
  }>;
}
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems?: number;
    totalPages?: number;
    page?: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string | null;
    prevCursor?: string | null;
  };
  links?: { self: string; next: string | null; prev: string | null };
}
export const orderApi = {
  getOrders: (params?: any) =>
    api
      .get<PaginatedResponse<OrderListItem>>("/admin/orders", { params })
      .then((res) => res.data),
  getOrder: (id: string) =>
    api.get<OrderDetails>(`/admin/orders/${id}`).then((res) => res.data),
  transitionStatus: (id: string, nextStatus: OrderStatusEnum, notes?: string) =>
    api.patch(`/admin/orders/${id}/status`, { nextStatus, notes }),
  createOrder: (data: CreateOrderInput) =>
    api.post<OrderDetails>("/admin/orders", data).then((res) => res.data),
};
export interface CreateOrderInput {
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  items: Array<{ variantId: string; quantity: number; price: number }>;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: {
    city?: string;
    district?: string;
    ward?: string;
    detail?: string;
  };
  note?: string;
}
