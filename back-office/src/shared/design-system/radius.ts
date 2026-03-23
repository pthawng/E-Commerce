/**
 * BORDER RADIUS SYSTEM
 * 
 * Luxury Feel: Slightly sharper corners convey precision and premium quality.
 * Overly rounded corners feel casual/playful.
 */

export const radius = {
    none: '0px',
    xs: '2px',   // Sharp, technical
    sm: '4px',   // Default for Inputs, Buttons in standard size
    md: '6px',   // Cards, Modals
    lg: '8px',   // Large Containers
    xl: '12px',  // Special Highlight Areas
    full: '9999px', // Pills, Avatars
} as const;
