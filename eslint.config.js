import jsxA11y from 'eslint-plugin-jsx-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tsdoc from 'eslint-plugin-tsdoc';
import tseslint from 'typescript-eslint';

export default [
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/__mocks__/**',
      'e2e/**',
      'src/test-utils/**',
    ],
  },
  // TypeScript base config
  ...tseslint.configs.recommended,
  // TSDoc rules for source files
  {
    files: ['src/**/*.ts'],
    plugins: {
      tsdoc,
      'jsx-a11y': jsxA11y,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'tsdoc/syntax': 'warn',
      // NOTE: TypeScript compiler flags unused vars via noUnusedLocals/noUnusedParameters
      '@typescript-eslint/no-unused-vars': 'off',
      'jsx-a11y/tabindex-no-positive': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/timing'],
              message: 'Do not import from timing.ts (removed in v2.0.0). Import from canonical sources.',
            },
          ],
        },
      ],
    },
  },
  // NOTE: Theme renderers must use onReducedMotionChange hook (orchestrator manages state)
  {
    files: ['src/themes/**/index.ts', 'src/themes/**/renderers/landing-page-renderer.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='reducedMotionManager'][callee.property.name='subscribe']",
          message: 'Theme renderers must use onReducedMotionChange hook, not direct subscription. The orchestrator manages reduced-motion state.',
        },
      ],
    },
  },
  // Rules for build/utility scripts
  {
    files: ['scripts/**/*.ts'],
    plugins: {
      tsdoc,
    },
    rules: {
      'tsdoc/syntax': 'warn',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
