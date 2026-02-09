/**
 * Design System Style Utilities
 * 
 * Type-safe style helpers that enforce design tokens.
 * Use these instead of inline arbitrary values.
 */

import * as tokens from './design-tokens';

// ============================================================================
// STATUS STYLES
// ============================================================================

type StatusKey = keyof typeof tokens.status;

export const createStatusStyle = (status: StatusKey) => ({
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    borderRadius: tokens.component.borderRadius.base,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    backgroundColor: tokens.status[status].background,
    color: tokens.status[status].text,
    border: `1px solid ${tokens.status[status].border}`,
    display: 'inline-block' as const,
});

// ============================================================================
// BUTTON STYLES
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

export const createButtonStyle = (variant: ButtonVariant) => {
    const baseStyle = {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.medium,
        borderRadius: tokens.component.borderRadius.base,
        padding: '6px 16px',
        height: 32,
        transition: tokens.component.transition.fast,
        cursor: 'pointer' as const,
    };

    switch (variant) {
        case 'primary':
            return {
                ...baseStyle,
                backgroundColor: tokens.action.primary,
                color: '#FFFFFF',
                border: 'none',
            };
        case 'danger':
            return {
                ...baseStyle,
                backgroundColor: 'transparent',
                color: tokens.action.danger,
                border: `1px solid ${tokens.neutral.border}`,
            };
        case 'secondary':
            return {
                ...baseStyle,
                backgroundColor: tokens.neutral.surface,
                color: tokens.neutral.textSecondary,
                border: `1px solid ${tokens.neutral.border}`,
            };
        case 'text':
            return {
                ...baseStyle,
                backgroundColor: 'transparent',
                color: tokens.neutral.textSecondary,
                border: 'none',
                padding: '6px 12px',
            };
    }
};

// ============================================================================
// LAYOUT STYLES
// ============================================================================

export const pageHeaderStyle = {
    padding: tokens.spacing.xxl,
    backgroundColor: tokens.neutral.surface,
    borderBottom: `1px solid ${tokens.neutral.borderLight}`,
};

export const filterBarStyle = {
    padding: `${tokens.spacing.lg}px ${tokens.spacing.xxl}px`,
    backgroundColor: tokens.neutral.background,
    borderBottom: `1px solid ${tokens.neutral.borderLight}`,
};

export const cardStyle = {
    backgroundColor: tokens.neutral.surface,
    border: `1px solid ${tokens.neutral.borderLight}`,
    borderRadius: tokens.component.borderRadius.base,
    padding: tokens.spacing.xxl,
};

export const contentContainerStyle = {
    padding: tokens.spacing.xxl,
    backgroundColor: tokens.neutral.background,
};

// ============================================================================
// TYPOGRAPHY STYLES
// ============================================================================

export const headingStyles = {
    pageTitle: {
        fontSize: tokens.typography.fontSize.xl,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.neutral.textPrimary,
        margin: 0,
        lineHeight: tokens.typography.lineHeight.tight,
    },
    sectionTitle: {
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.medium,
        color: tokens.neutral.textPrimary,
        margin: 0,
        lineHeight: tokens.typography.lineHeight.tight,
    },
    cardTitle: {
        fontSize: tokens.typography.fontSize.md,
        fontWeight: tokens.typography.fontWeight.medium,
        color: tokens.neutral.textPrimary,
        margin: 0,
        lineHeight: tokens.typography.lineHeight.tight,
    },
};

export const textStyles = {
    label: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.medium,
        color: tokens.neutral.textSecondary,
    },
    body: {
        fontSize: tokens.typography.fontSize.md,
        fontWeight: tokens.typography.fontWeight.normal,
        color: tokens.neutral.textPrimary,
        lineHeight: tokens.typography.lineHeight.base,
    },
    caption: {
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.normal,
        color: tokens.neutral.textTertiary,
    },
    subtitle: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.normal,
        color: tokens.neutral.textTertiary,
    },
};

// ============================================================================
// TABLE STYLES
// ============================================================================

export const tableStyles = {
    header: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.medium,
        color: tokens.neutral.textSecondary,
    },
    cell: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.normal,
        color: tokens.neutral.textPrimary,
    },
    row: {
        borderBottom: `1px solid ${tokens.neutral.borderSubtle}`,
    },
};

// ============================================================================
// FORM STYLES
// ============================================================================

export const formStyles = {
    input: {
        fontSize: tokens.typography.fontSize.base,
        color: tokens.neutral.textPrimary,
        backgroundColor: tokens.neutral.surface,
        border: `1px solid ${tokens.neutral.border}`,
        borderRadius: tokens.component.borderRadius.base,
        padding: '6px 12px',
        height: 32,
    },
    label: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.medium,
        color: tokens.neutral.textSecondary,
        marginBottom: tokens.spacing.sm,
        display: 'block' as const,
    },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const createSpacing = (...values: Array<keyof typeof tokens.spacing>) => {
    return values.map(v => `${tokens.spacing[v]}px`).join(' ');
};

export const createGap = (size: keyof typeof tokens.spacing) => ({
    gap: tokens.spacing[size],
});
