import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { envValidator } from "./scripts/vite-plugin-env-validator";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    envValidator(), // Staff+ Enforcement: Build-time validation
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['jewelry.png', 'robots.txt'],
      manifest: {
        name: 'Ray Paradis | Luxury Jewelry',
        short_name: 'Ray Paradis',
        description: 'Exquisite high jewelry crafted with passion and precision.',
        theme_color: '#0b1220',
        icons: [
          {
            src: 'jewelry.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'jewelry.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react', 'framer-motion'],
          'vendor-utils': ['@tanstack/react-query', 'axios', 'zustand', 'zod']
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared/src"),
      "zod": path.resolve(__dirname, "./node_modules/zod"),
    },
  },
}));
