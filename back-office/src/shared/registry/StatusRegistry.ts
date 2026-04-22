/**
 * Centralized Status Registry
 * 
 * Enforces a single source of truth for all business status mappings.
 * Removes hardcoded string logic from UI components.
 */

export interface SemanticStatus {
    label: string;
    value: string;
    type: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    color: string;
    bg: string;
    border: string;
}

export const StatusRegistry = {
    STOCK: {
        IN_STOCK: {
            label: 'In Stock',
            value: 'success',
            type: 'success',
            color: 'var(--color-status-success-text)',
            bg: 'var(--color-status-success-bg)',
            border: 'var(--color-status-success-border)'
        },
        LOW_STOCK: {
            label: 'Low Stock',
            value: 'warning',
            type: 'warning',
            color: 'var(--color-status-warning-text)',
            bg: 'var(--color-status-warning-bg)',
            border: 'var(--color-status-warning-border)'
        },
        OUT_OF_STOCK: {
            label: 'Out of Stock',
            value: 'error',
            type: 'error',
            color: 'var(--color-status-error-text)',
            bg: 'var(--color-status-error-bg)',
            border: 'var(--color-status-error-border)'
        }
    },
    ORDER: {
        PENDING: {
            label: 'Pending',
            value: 'warning',
            type: 'warning',
            color: 'var(--color-status-warning-text)',
            bg: 'var(--color-status-warning-bg)',
            border: 'var(--color-status-warning-border)'
        },
        CONFIRMED: {
            label: 'Confirmed',
            value: 'info',
            type: 'info',
            color: 'var(--color-status-info-text)',
            bg: 'var(--color-status-info-bg)',
            border: 'var(--color-status-info-border)'
        },
        DELIVERED: {
            label: 'Delivered',
            value: 'success',
            type: 'success',
            color: 'var(--color-status-success-text)',
            bg: 'var(--color-status-success-bg)',
            border: 'var(--color-status-success-border)'
        },
        CANCELLED: {
            label: 'Cancelled',
            value: 'error',
            type: 'error',
            color: 'var(--color-status-error-text)',
            bg: 'var(--color-status-error-bg)',
            border: 'var(--color-status-error-border)'
        }
    }
} as const;

export type StockStatusType = keyof typeof StatusRegistry.STOCK;
export type OrderStatusType = keyof typeof StatusRegistry.ORDER;

/**
 * Utility to map a raw database value to a semantic UI status
 */
export const mapStockStatus = (available: number): SemanticStatus => {
    if (available <= 0) return StatusRegistry.STOCK.OUT_OF_STOCK;
    if (available <= 20) return StatusRegistry.STOCK.LOW_STOCK;
    return StatusRegistry.STOCK.IN_STOCK;
};
