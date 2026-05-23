export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  totals: OrderTotals;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: "vnpay" | "paypal" | "bank_transfer";
  timeline: OrderTimelineEvent[];
  productionStage?:
    | "design"
    | "casting"
    | "setting"
    | "polishing"
    | "engraving";
  priority?: "normal" | "high" | "vip";
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_production"
  | "quality_control"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "partially_paid"
  | "failed"
  | "refunded";

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantDescription: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  description: string;
  timestamp: string;
  userId?: string; // Admin who triggered the change
}
