/**
 * LUXURY JEWELRY BACK-OFFICE COLOR SYSTEM
 * Brand: Ray Paradis
 * Aesthetic: Deep Midnight Blue, Silver/Gold Accents, Timeless Elegance.
 */

export const colors = {
    // Brand Colors
    primary: {
        lighter: '#334E6F',
        light: '#1D3F66',
        main: '#0B2545', // Deep Midnight Blue - Ray Paradis Brand Color
        dark: '#061426',
        darker: '#020A14',
    },

    secondary: {
        lighter: '#F9F1E6',
        light: '#E8D5C0',
        main: '#C5A065', // Muted Satin Gold - Elegant, not yellow
        dark: '#8E6E38',
        darker: '#56411F',
    },

    // Functional Colors (Status)
    success: {
        bg: '#F0F9EB',
        border: '#B2D8B4',
        main: '#2E5C35', // Deep green
        text: '#1B3B20',
    },
    warning: {
        bg: '#FFF8E6',
        border: '#FFDCA8',
        main: '#B57B0D', // Gold/Amber
        text: '#754C00',
    },
    error: {
        bg: '#FEF2F2',
        border: '#F8B4B4',
        main: '#9B1C1C', // Deep red
        text: '#771D1D',
    },
    info: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        main: '#1E40AF', // Deep blue
        text: '#1E3A8A',
    },

    // Neutral Scale (Cool Grays)
    neutral: {
        white: '#FFFFFF',
        50: '#F8FAFC', // Very cool gray
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155', // Headings
        800: '#1E293B',
        900: '#0F172A', // Deepest text
        black: '#020617',
    },

    // Semantic Backgrounds
    background: {
        body: '#F8FAFC',      // Cool light gray
        surface: '#FFFFFF',
        sidebar: '#0B2545',   // Brand Navy for Sidebar
        input: '#FFFFFF',
        modal: '#FFFFFF',
    },

    // Semantic Borders
    border: {
        subtle: '#F1F5F9',
        default: '#E2E8F0',
        strong: '#CBD5E1',
    },

    // Semantic Text
    text: {
        primary: '#0F172A',
        secondary: '#475569',
        tertiary: '#94A3B8',
        disabled: '#CBD5E1',
        inverse: '#FFFFFF', // For text on Navy background
    }
};
