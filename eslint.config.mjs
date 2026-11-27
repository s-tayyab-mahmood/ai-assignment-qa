// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', 'reports/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Governance rules from skills/playwright.md and skills/review.md
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-skipped-test': 'warn',
      'playwright/no-focused-test': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      // Assertions live in page objects / helpers too (scenario-tagged expect wrappers).
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expect', 'expectCart', 'expectAddress'] },
      ],
      'playwright/no-conditional-in-test': 'warn',
    },
  },
  {
    // Type-aware promise rules: an un-awaited Playwright call can let a test pass without checking anything.
    files: ['**/*.ts'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message: 'Fixed sleeps are forbidden. Wait on a condition instead.',
        },
      ],
    },
  },
);
