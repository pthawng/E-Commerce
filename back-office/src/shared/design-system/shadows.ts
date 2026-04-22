/**
 * SHADOW SYSTEM
 * 
 * Feel: Soft, diffused, meaningful elevation.
 * Avoid: Harsh, dark shadows (Material Design v1 style).
 */

export const shadows = {
    none: 'none',

    // Subtle separation (Cards, Panels)
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',

    // Default elevation (Cards, Popups)
    md: '0 10px 30px rgba(0, 0, 0, 0.04)',

    // Significant elevation (Modals, Drawers)
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.015)',

    // Highest elevation (Tooltips, Popovers)
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',

    // Inner shadows for depth
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;
