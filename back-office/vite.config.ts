import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        chunkSizeWarningLimit: 1400,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom', 'react-router-dom'],
                    antd: ['antd', '@ant-design/icons'],
                    charts: ['recharts'],
                    query: ['@tanstack/react-query', 'axios', 'zustand', 'socket.io-client'],
                    motion: ['framer-motion'],
                    i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
                    forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
                },
            },
        },
    },
    server: {
        port: 5174,
    },
});
