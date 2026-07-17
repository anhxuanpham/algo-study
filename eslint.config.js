import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['.astro/**', 'dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['public/**/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
