import { ProductVariant } from '@/features/products/types';

export interface CartItem {
    id: string; // Unique ID for the cart line (item + variant)
    productId: string;
    variantId: string;
    name: { [key: string]: string };
    price: number;
    quantity: number;
    image: string;
    slug: string;
    attributes: {
        name: string;
        value: string;
    }[];
    stock: number;
}

export interface CartTotals {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    isFreeShipping: boolean;
    shippingThreshold: number;
}

export type CartStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface CartWarning {
    type: 'OUT_OF_STOCK' | 'QUANTITY_REDUCED' | string;
    message?: string;
}

export interface Cart {
    items: CartItem[];
    totals: CartTotals;
    version?: number;
    warnings?: CartWarning[];
}

export interface CartConfig {
    shippingThreshold: number;
    shippingFee: number;
    currency: string;
    maxQuantityPerItem: number;
}
