import { defineConfig } from 'tsup';

/**
 * Dual Package Build Configuration
 * Build cả CommonJS (cho backend) và ESM (cho frontend)
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'], // Build cả CommonJS và ESM
  dts: true, // Generate .d.ts files
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  treeshake: true,
  minify: false, // Không minify để dễ debug
  target: 'es2023',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs', // .js cho CJS, .mjs cho ESM
    };
  },
});

