module.exports = {
  root: true,

  // ===========================================
  // Javascript configuration
  // ===========================================
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
    'plugin:eslint-comments/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    'curly': [
      'error', 'multi-line'
    ],
    'no-template-curly-in-string': 'error',
    'class-methods-use-this': 'warn',
    'consistent-return': 'error',
    'eqeqeq': 'error',
    'no-else-return': 'warn',
    'no-eval': 'error',
    'no-implicit-globals': 'error',
    'prefer-promise-reject-errors': 'warn',
    'prefer-regex-literals': 'warn',
    'require-await': 'warn',
    'wrap-iife': 'warn',
    'camelcase': 'warn',
    'eol-last': 'error',
    'implicit-arrow-linebreak': [
      'warn',
      'beside'
    ],
    'key-spacing': 'warn',
    'no-lonely-if': 'error',
    'no-multi-assign': 'warn',
    'no-nested-ternary': 'error',
    'no-trailing-spaces': 'warn',
    'no-unneeded-ternary': 'warn',
    'prefer-object-spread': 'warn',
    'quote-props': 'warn',
    'space-infix-ops': 'warn',
    'no-var': 'error',
    'prefer-arrow-callback': 'warn',
    'prefer-const': 'warn',
    'prefer-destructuring': 'warn',
    'prefer-rest-params': 'error',
    'prefer-spread': 'warn',
    'prefer-template': 'warn',
    'rest-spread-spacing': 'warn',
    'brace-style': [
      'warn',
      '1tbs',
      {
        'allowSingleLine': true
      }
    ],
    'func-call-spacing': 'warn',
    'no-dupe-class-members': 'error',
    'no-duplicate-imports': 'error',
    'no-extra-parens': 'error',
    'no-extra-semi': 'error',
    'no-implied-eval': 'error',
    'no-loss-of-precision': 'error',
    'no-redeclare': 'error',
    'no-shadow': 'error',
    'no-unused-expressions': 'error',
    'no-unused-vars': 'error',
    'semi': 'error',
  },

  // ===========================================
  // Typescript configuration
  // ===========================================
  overrides: [
    {
      files: ["**/*.ts"],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json'
      },
      plugins: [
        '@typescript-eslint',
        'jest',
      ],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:eslint-comments/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:jest/recommended',
        'plugin:jest/style',
      ],
      rules: {
        'brace-style': 'off',
        '@typescript-eslint/brace-style': [
          'warn',
          '1tbs',
          {
            'allowSingleLine': true
          }
        ],
        'func-call-spacing': 'off',
        '@typescript-eslint/func-call-spacing': 'warn',
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': 'error',
        'no-duplicate-imports': 'off',
        '@typescript-eslint/no-duplicate-imports': 'error',
        'no-extra-parens': 'off',
        '@typescript-eslint/no-extra-parens': 'error',
        '@typescript-eslint/no-empty-interface': ['error', { 'allowSingleExtends': true }],
        'no-extra-semi': 'off',
        '@typescript-eslint/no-extra-semi': 'error',
        'no-implied-eval': 'off',
        '@typescript-eslint/no-implied-eval': 'error',
        'no-loss-of-precision': 'off',
        '@typescript-eslint/no-loss-of-precision': 'error',
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'error',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
        'semi': 'off',
        '@typescript-eslint/semi': 'error',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};
