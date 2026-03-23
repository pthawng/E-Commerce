/**
 * TYPOGRAPHY SYSTEM
 * 
 * Font Family:
 * - Sans: 'Inter' (Clean, modern, legible)
 * - Serif: 'Playfair Display' (Luxury, Elegant, used for Headings)
 * - Mono: 'JetBrains Mono' (Code)
 */

export const typography = {
    fontFamily: {
        sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        serif: "'Playfair Display', Georgia, 'Times New Roman', serif", // Brand Headings
        mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    },

    // Heading Scale - Use Serif for main interactions
    heading: {
        h1: {
            fontFamily: "'Playfair Display', serif",
            fontSize: '32px',
            lineHeight: '40px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        },
        h2: {
            fontFamily: "'Playfair Display', serif",
            fontSize: '28px',
            lineHeight: '36px',
            fontWeight: 600,
            letterSpacing: '0em',
        },
        h3: {
            fontFamily: "'Playfair Display', serif",
            fontSize: '24px',
            lineHeight: '32px',
            fontWeight: 600,
            letterSpacing: '0em',
        },
        h4: {
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px',
            lineHeight: '28px',
            fontWeight: 600,
            letterSpacing: '0em',
        },
        h5: {
            fontFamily: "'Inter', sans-serif", // Smaller headings can be sans for clarity
            fontSize: '16px',
            lineHeight: '22px',
            fontWeight: 600,
            letterSpacing: '0em',
        },
        h6: {
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
        },
    },

    // Body Text Scale - Inter for best readability
    body: {
        lg: {
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 400,
        },
        md: { // Default
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 400,
        },
        sm: {
            fontSize: '13px',
            lineHeight: '18px',
            fontWeight: 400,
        },
        xs: { // Legal, captions
            fontSize: '12px',
            lineHeight: '16px',
            fontWeight: 400,
        },
    },

    fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
} as const;
