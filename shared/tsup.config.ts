import { defineConfig } from 'tsup';

/**
 * Dual Package Build Configuration
 * Build cả CommonJS (cho backend) và ESM (cho frontend)
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], 
  dts: true, 
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  treeshake: true,
  minify: false, 
  target: 'es2023',
  external: ['zod'], // Tránh lỗi instance mismatch khi dùng Zod trong monorepo
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs', 
    };
  },
});

