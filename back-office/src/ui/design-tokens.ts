/**
 * Design Tokens - Luxury Back Office
 * 
 * Purpose: Centralized design system for a calm, professional admin interface.
 * This file serves as a reference for incremental UI refinement.
 * 
 * DO NOT import this into components yet.
 * Use as a reference when refining existing UI.
 */

// ============================================================================
// COLORS
// ============================================================================

/**
 * Neutral Palette
 * 
 * Intent: Create a calm, professional foundation.
 * - Soft backgrounds reduce eye strain during 8-hour shifts
 * - Near-black text (not pure black) is easier to read
 * - Subtle borders and dividers don't compete with content
 */
export const neutral = {
    // Backgrounds
    background: '#FAFAFA',      // Page background - soft white
    surface: '#FFFFFF',          // Card/panel background - pure white
    surfaceHover: '#F8F8F8',    // Subtle hover state

    // Borders & Dividers
    border: '#E5E5E5',          // Standard border
    borderLight: '#F0F0F0',     // Lighter border/divider
    borderSubtle: '#F5F5F5',    // Very subtle separator

    // Text
    textPrimary: '#1A1A1A',     // Main content - near black
    textSecondary: '#666666',    // Labels, secondary info
    textTertiary: '#999999',     // Placeholder, disabled
    textQuaternary: '#BBBBBB',   // Very subtle text
} as const;

/**
 * Status Colors (Muted)
 * 
 * Intent: Communicate status without visual aggression.
 * - Desaturated colors reduce cognitive load
 * - Subtle backgrounds with darker text for readability
 * - Lowercase labels feel calmer than ALL CAPS
 * 
 * Usage: Apply as background + border + text color for badges
 */
export const status = {
    // Pending Payment - Muted gold/beige
    pending: {
        background: '#F5F0E8',
        border: '#E8DCC8',
        text: '#8B7355',
    },

    // Confirmed - Muted blue
    confirmed: {
        background: '#EBF1F5',
        border: '#D1DEE6',
        text: '#5A7A8C',
    },

    // Processing - Muted teal
    processing: {
        background: '#EDF5F0',
        border: '#D5E5DB',
        text: '#5A7A6B',
    },

    // Shipped - Muted purple
    shipped: {
        background: '#F0EDF5',
        border: '#DDD5E6',
        text: '#7A6B8C',
    },

    // Delivered - Muted sage green
    delivered: {
        background: '#EDF5ED',
        border: '#D5E5D5',
        text: '#5A7A5A',
    },

    // Cancelled - Muted rose
    cancelled: {
        background: '#F5EDED',
        border: '#E6D5D5',
        text: '#8C5A5A',
    },

    // Info - Very subtle blue-gray
    info: {
        background: '#F8F9FA',
        border: '#E8EBED',
        text: '#5A6B7A',
    },

    // Active - Muted green (similar to delivered but distinct)
    active: {
        background: '#EDF5ED',
        border: '#D5E5D5',
        text: '#5A7A5A',
    },

    // Inactive - Muted gray
    inactive: {
        background: '#F5F5F5',
        border: '#E5E5E5',
        text: '#999999',
    },

    // Verified - Muted blue (similar to confirmed)
    verified: {
        background: '#EBF1F5',
        border: '#D1DEE6',
        text: '#5A7A8C',
    },
} as const;

/**
 * Action Colors
 * 
 * Intent: Clear but not aggressive action states.
 * - Primary: Dark slate for important actions (rare)
 * - Danger: Muted red for destructive actions
 * - Secondary: Gray for common actions
 */
export const action = {
    // Primary action (use sparingly)
    primary: '#2C3E50',
    primaryHover: '#34495E',

    // Destructive action (cancel, delete, refund)
    danger: '#A85C5C',
    dangerHover: '#B86C6C',

    // Secondary action (most common)
    secondary: '#8C8C8C',
    secondaryHover: '#666666',

    // Link/text action
    link: '#5A7A8C',
    linkHover: '#4A6A7C',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * Typography Scale
 * 
 * Intent: Clear hierarchy without excessive variation.
 * - System fonts for familiarity and performance
 * - Limited scale prevents visual chaos
 * - Consistent line heights for vertical rhythm
 */
export const typography = {
    // Font families
    fontFamily: {
        base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
    },

    // Font sizes (in px for clarity)
    fontSize: {
        xs: 11,      // Very small labels, captions
        sm: 12,      // Secondary text, table cells
        base: 13,    // Default body text, labels
        md: 14,      // Primary content, values
        lg: 16,      // Card titles, section headers
        xl: 18,      // Page titles
        xxl: 24,     // Main page headings
    },

    // Font weights
    fontWeight: {
        normal: 400,   // Body text
        medium: 500,   // Labels, emphasis
        semibold: 600, // Headings, important values
    },

    // Line heights
    lineHeight: {
        tight: 1.3,    // Headings
        base: 1.5,     // Body text
        relaxed: 1.6,  // Long-form content
    },
} as const;

// ============================================================================
// SPACING
// ============================================================================

/**
 * Spacing Scale
 * 
 * Intent: Consistent rhythm and breathing room.
 * - Based on 4px grid for alignment
 * - Limited scale prevents arbitrary spacing
 * - Use consistently across all components
 */
export const spacing = {
    xs: 4,      // Tight spacing within components
    sm: 8,      // Small gaps, compact layouts
    md: 12,     // Standard spacing between related items
    lg: 16,     // Spacing between sections
    xl: 20,     // Larger gaps, card spacing
    xxl: 24,    // Page padding, major sections
    xxxl: 32,   // Extra large spacing (rare)
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

/**
 * Component-Specific Tokens
 * 
 * Intent: Reusable patterns for common UI elements.
 * Reference these when refining components.
 */
export const component = {
    // Border radius
    borderRadius: {
        sm: 2,
        base: 4,
        lg: 6,
    },

    // Shadows (very subtle)
    shadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        base: '0 1px 3px rgba(0, 0, 0, 0.06)',
        lg: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },

    // Transitions
    transition: {
        fast: '0.15s ease',
        base: '0.2s ease',
        slow: '0.3s ease',
    },
} as const;

// ============================================================================
// USAGE EXAMPLES (for reference only)
// ============================================================================

/**
 * Example: Status Badge
 * 
 * const StatusBadge = ({ status }: { status: 'pending' | 'confirmed' | ... }) => (
 *   <span style={{
 *     padding: `${spacing.xs}px ${spacing.md}px`,
 *     borderRadius: component.borderRadius.base,
 *     fontSize: typography.fontSize.sm,
 *     fontWeight: typography.fontWeight.medium,
 *     backgroundColor: status.pending.background,
 *     color: status.pending.text,
 *     border: `1px solid ${status.pending.border}`,
 *   }}>
 *     Pending payment
 *   </span>
 * );
 */

/**
 * Example: Table Header
 * 
 * const tableHeaderStyle = {
 *   fontSize: typography.fontSize.base,
 *   fontWeight: typography.fontWeight.medium,
 *   color: neutral.textSecondary,
 *   padding: `${spacing.md}px ${spacing.lg}px`,
 * };
 */

/**
 * Example: Action Button (Text)
 * 
 * const textButtonStyle = {
 *   fontSize: typography.fontSize.base,
 *   color: action.secondary,
 *   padding: `${spacing.sm}px ${spacing.md}px`,
 *   transition: component.transition.fast,
 *   ':hover': {
 *     color: action.secondaryHover,
 *   },
 * };
 */
