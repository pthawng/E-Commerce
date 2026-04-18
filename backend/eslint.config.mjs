// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist', 'node_modules', 'coverage'],
  },

  // Các config nền tảng
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,

  // Config riêng cho TypeScript trong src
  {
    files: ['src/**/*.ts', 'test/**/*.ts', 'apps/**/*.ts', 'libs/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        // @ts-ignore - import.meta.dirname is available in Node 20.11+
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Fix lỗi Prettier xuống dòng trên Windows
      "prettier/prettier": ["error", { endOfLine: "auto" }],

      // Staff+ Enforcement: Ban direct process.env usage (Warn during migration)
      "no-restricted-properties": [
        "warn",
        {
          "object": "process",
          "property": "env",
          "message": "Direct access to process.env is forbidden. Use ConfigService instead."
        }
      ],
    },
  },
  {
    // Allow process.env ONLY in config/validation layers, entry point, and scripts
    files: ['src/main.ts', 'src/config/env.schema.ts', 'src/config/env.validator.ts', 'src/config/app-config.module.ts', 'scripts/**/*.ts'],
    rules: {
      "no-restricted-properties": "off"
    }
  }
);