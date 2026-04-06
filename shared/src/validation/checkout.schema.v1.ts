import { z } from 'zod';

/**
 * Checkout Shipping Schema V1
 * Ensures strict address, email, and phone formatting
 */
export const CheckoutShippingSchemaV1: z.ZodType<CheckoutShippingV1> = z.object({
  fullName: z.string().trim().min(2, 'Name too short').max(100, 'Name too long'),
  phone: z.string().trim().regex(/^[0-9+]{8,15}$/, 'Invalid phone number format'),
  email: z.string().trim().email('Invalid email address').max(150),
  addressLine: z.string().trim().min(5, 'Address too short').max(200),
  ward: z.string().trim().min(1, 'Ward required').max(100),
  district: z.string().trim().min(1, 'District required').max(100),
  province: z.string().trim().min(1, 'Province required').max(100),
});

export const CreateOrderSchemaV1 = z.object({
  checkoutToken: z.string().min(1, 'Checkout token required'),
  shippingAddress: CheckoutShippingSchemaV1,
  paymentMethod: z.enum(['VIETQR', 'VNPAY', 'PAYPAL']),
  guestEmail: z.string().email().optional(),
  confirmPriceChange: z.boolean().default(true),
});

export interface CheckoutShippingV1 {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  ward: string;
  district: string;
  province: string;
}

export type CreateOrderV1 = z.infer<typeof CreateOrderSchemaV1>;
