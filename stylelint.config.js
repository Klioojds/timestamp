/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
    'no-descending-specificity': null,
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    'comment-empty-line-before': null,
    'rule-empty-line-before': null,
    'declaration-block-single-line-max-declarations': null,
    'media-feature-range-notation': null,
    'alpha-value-notation': 'percentage',
    'color-function-notation': 'modern',
    'color-hex-length': 'short',
    'shorthand-property-no-redundant-values': true,
    'declaration-block-no-duplicate-properties': [
      true,
      {
        ignore: ['consecutive-duplicates-with-different-values'],
      },
    ],
    'declaration-block-no-shorthand-property-overrides': true,
    'block-no-empty': true,
    'no-duplicate-selectors': true,
    'no-empty-source': true,
    'property-no-deprecated': true,
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme', 'screen', 'clamp', 'min', 'max'],
      },
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'layer', 'screen', 'use', 'forward', 'mixin', 'include', 'extend'],
      },
    ],
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'layer', 'screen', 'use', 'forward', 'mixin', 'include', 'extend'],
      },
    ],
    'import-notation': 'string',
    'declaration-block-no-redundant-longhand-properties': null,
  },
  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    'dev-dist/**',
    'coverage/**',
    '**/*.min.css',
  ],
};

