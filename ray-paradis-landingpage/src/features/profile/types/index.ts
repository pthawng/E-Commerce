import { z } from 'zod';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  lastLoginAt?: string | null;
  createdAt: string;
  userType: 'CUSTOMER' | 'STAFF' | 'SUPER_ADMIN';
}

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface OrderItem {
  id: string;
  productVariantId: string;
  productName: string;
  sku: string;
  variantTitle: any;
  thumbnailUrl: string | null;
  productVariant?: {
    thumbnailUrl: string | null;
  };
  quantity: number;
  price: number;
  totalLine: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'completed' | 'cancelled' | 'failed' | 'pending_payment' | 'returned' | 'refunded';

export type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded';

export interface OrderTimeline {
  id: string;
  action: string;
  fromStatus?: OrderStatus | null;
  toStatus?: OrderStatus | null;
  description?: string | null;
  createdAt: string;
  actorType: 'system' | 'admin' | 'customer';
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'reversed';
  provider: string;
  method?: string | null;
  transactionCode?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subTotal: number;
  shippingFee: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  timelines: OrderTimeline[];
  transactions: PaymentTransaction[];
  shippingAddress: any;
  paymentMethod?: string | null;
  paymentDeadline?: string | null;
  cancelReason?: string | null;
}


