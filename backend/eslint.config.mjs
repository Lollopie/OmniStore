// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    ignores: ['eslint.config.mjs', '**/dist/**', '**/coverage/**'],
  },
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      jest: jestPlugin,
      prettier: prettier,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      eslintPluginPrettierRecommended,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/return-await': ['error', 'always'],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: ['**/*.{js}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['test/**/*.{ts,tsx}'],
    extends: [jestPlugin.configs['flat/recommended']],
  },
);
