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
}

export type CartStatus = 'idle' | 'syncing' | 'success' | 'error';
