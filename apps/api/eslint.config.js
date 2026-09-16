const tseslint = require('typescript-eslint');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'eslint.config.js', 'jest.*.config.js'] },
  tseslint.configs.recommended,
  {
    rules: {
      'object-curly-spacing': ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  prettierRecommended,
);
