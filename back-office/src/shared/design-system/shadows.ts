/**
 * SHADOW SYSTEM
 * 
 * Feel: Soft, diffused, meaningful elevation.
 * Avoid: Harsh, dark shadows (Material Design v1 style).
 */

export const shadows = {
    none: 'none',

    // Subtle separation (Cards, Panels)
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

    // Default elevation (Dropdowns, Hover Cards)
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',

    // Significant elevation (Modals, Drawers)
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',

    // Highest elevation (Tooltips, Popovers)
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',

    // Inner shadows for depth
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;
