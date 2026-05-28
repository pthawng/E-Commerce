import { z } from 'zod';

/**
 * Checkout Shipping Schema V1
 * Ensures strict address, email, and phone formatting
 */
export const CheckoutShippingSchemaV1: z.ZodType<CheckoutShippingV1> = z.object({
  fullName: z.string().trim().min(2, 'checkout.validation.nameTooShort').max(100, 'checkout.validation.nameTooLong'),
  phone: z.string().trim().regex(/^[0-9+]{8,15}$/, 'checkout.validation.invalidPhone'),
  email: z.string().trim().email('checkout.validation.invalidEmail').max(150),
  addressLine: z.string().trim().min(5, 'checkout.validation.addressTooShort').max(200),
  ward: z.string().trim().min(1, 'checkout.validation.wardRequired').max(100),
  district: z.string().trim().min(1, 'checkout.validation.districtRequired').max(100),
  province: z.string().trim().min(1, 'checkout.validation.provinceRequired').max(100),
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
