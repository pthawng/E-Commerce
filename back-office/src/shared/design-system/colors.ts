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
        main: '#0B2545', // Midnight Navy
        dark: '#061426',
        darker: '#020A14',
    },

    secondary: {
        lighter: '#F9F1E6',
        light: '#E8D5C0',
        main: '#C5A065', // Satin Gold
        dark: '#8E6E38',
        darker: '#56411F',
    },

    // Functional Colors (Status - Luxury Emerald/Amber/Crimson)
    success: {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        main: '#065F46',
        text: '#064E3B',
    },
    warning: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        main: '#92400E',
        text: '#78350F',
    },
    error: {
        bg: '#FEF2F2',
        border: '#FECACA',
        main: '#991B1B',
        text: '#7F1D1D',
    },
    info: {
        bg: '#F0F9FF',
        border: '#BAE6FD',
        main: '#075985',
        text: '#0C4A6E',
    },

    // Brand Signature
    brand: {
        gold: '#C5A065',
        goldSubtle: 'rgba(197, 160, 101, 0.1)',
    },

    // Interaction Contract
    interaction: {
        hoverBrightness: 'brightness(1.05)',
        transition: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        activeScale: 'scale(0.98)',
        focusRing: '0 0 0 2px rgba(197, 160, 101, 0.2)',
    },

    // Neutral Scale (Luxury Slate)
    neutral: {
        white: '#FFFFFF',
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
        black: '#020617',
    },

    // Semantic Backgrounds
    background: {
        body: '#F8FAFC',
        surface: '#FFFFFF',
        sidebar: '#0B2545',
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
        inverse: '#FFFFFF',
    }
};
