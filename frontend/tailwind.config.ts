import plugin from 'tailwindcss/plugin';
import type { PluginAPI } from 'tailwindcss/types/config';

module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.css',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'primary': 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'secondary': 'var(--color-secondary)',
        'secondary-hover': 'var(--color-secondary-hover)',
        'button-bg': 'var(--color-button-bg)',
        'button-bg-hover': 'var(--color-button-bg-hover)',
        'button-text': 'var(--color-button-text)',
        'border-light': 'var(--color-border-light)',
        'border-heavy': 'var(--color-border-heavy)',
      },
      fontSize: {
        base: ['1rem', '1.75'],       // p
        lg: ['1.125rem', '1.75'],     // smaill heading
        xl: ['1.25rem', '1.5'],       // h3
        '2xl': ['1.5rem', '1.3'],     // h2 
        '3xl': ['2rem', '1.2'],       // h1 
      },

      fontFamily: { sans: ['var(--font-sans)', 'sans-serif'] },
      boxShadow: {
        lux: '0 4px 20px var(--color-shadow)',
        glow: '0 0 20px var(--color-glow-accent)',
      },
      borderRadius: { lg: '12px', xl: '20px' },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        '.flex-center': {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
        '.card': {
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px var(--color-shadow)',
          padding: '1rem',
        },
        '.btn': {
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: '0.2s',
        },
      });
    }),
  ],
};
