import { CartItem, CartTotals } from '../types';

/**
 * Pricing Engine
 * Handles all business logic for cart calculations.
 * Supports:
 * - Tiered shipping (Free above threshold)
 * - Tax calculations (if applicable)
 * - Discount application (placeholder)
 */

const SHIPPING_THRESHOLD = 10000; // Free shipping over $10,000
const FLAT_SHIPPING_RATE = 150; // $150 white-glove delivery
const TAX_RATE = 0; // Currently 0 for luxury export or local policy

export const calculateTotals = (items: CartItem[]): CartTotals => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const isFreeShipping = subtotal >= SHIPPING_THRESHOLD || items.length === 0;
    const shipping = isFreeShipping ? 0 : FLAT_SHIPPING_RATE;
    
    // In a real app, tax might depend on location
    const tax = subtotal * TAX_RATE;
    
    const total = subtotal + shipping + tax;

    return {
        subtotal,
        shipping,
        tax,
        total,
        isFreeShipping
    };
};
