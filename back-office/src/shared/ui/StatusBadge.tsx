import { createStatusStyle } from '@/ui/styles';
import * as tokens from '@/ui/design-tokens';

type BadgeStatus = 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'active' | 'inactive' | 'verified' | 'pending';

interface StatusBadgeProps {
    status: BadgeStatus;
    label?: string;
}

const STATUS_LABELS: Record<BadgeStatus, string> = {
    pending_payment: 'Pending payment',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
    verified: 'Verified',
    pending: 'Pending',
};

const STATUS_MAP: Record<BadgeStatus, keyof typeof tokens.status> = {
    pending_payment: 'pending',
    confirmed: 'confirmed',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
    active: 'active',
    inactive: 'inactive',
    verified: 'verified',
    pending: 'pending',
};

/**
 * StatusBadge Component
 * 
 * Displays order status with consistent muted styling.
 * Uses design tokens for colors and typography.
 */
export function StatusBadge({ status, label }: StatusBadgeProps) {
    return (
        <span style={createStatusStyle(STATUS_MAP[status])}>
            {label || STATUS_LABELS[status]}
        </span>
    );
}
