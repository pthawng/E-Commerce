/**
 * SPACING SYSTEM
 * 
 * Base unit: 4px
 * Grid: 8px preferred for layout
 */

export const spacing = {
    // Scale
    0: '0px',
    0.5: '2px',
    1: '4px',    // xs
    1.5: '6px',
    2: '8px',    // sm
    3: '12px',
    4: '16px',   // md
    5: '20px',
    6: '24px',   // lg
    8: '32px',   // xl
    10: '40px',  // 2xl
    12: '48px',
    16: '64px',  // 3xl
    20: '80px',
    24: '96px',

    // Semantic Aliases
    layout: {
        gutter: '24px',
        containerPadding: '32px',
        sidebarWidth: '260px',
        topbarHeight: '64px',
    },

    component: {
        ignore: '0px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
    },

    form: {
        elementSpacing: '24px',
        innerSpacing: '8px',
    },
} as const;
