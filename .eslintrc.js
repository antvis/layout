// https://eslint.org/docs/rules/
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    project: ['./tsconfig.json']
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/array-type': [
      'error',
      {
        default: 'array-simple'
      }
    ],
    '@typescript-eslint/ban-ts-comment': [
      'warn',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        'ts-check': 'allow-with-description'
      }
    ],
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Object: {
            message: 'Use {} instead.'
          },
          String: {
            message: 'Use string instead.'
          },
          Number: {
            message: 'Use number instead.'
          },
          Boolean: {
            message: 'Use boolean instead.'
          },
          Function: {
            message: 'Use specific callable interface instead.'
          }
        }
      }
    ],
    '@typescript-eslint/consistent-type-definitions': 'error',
    '@typescript-eslint/explicit-member-accessibility': [
      'off',
      {
        accessibility: 'explicit'
      }
    ],
    '@typescript-eslint/no-empty-function': ['error', { allow: ['functions', 'arrowFunctions', 'methods'] }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-inferrable-types': [
      'error',
      {
        ignoreParameters: true,
        ignoreProperties: true
      }
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-this-alias': [
      'error',
      {
        allowDestructuring: false, // Disallow `const { props, state } = this`; true by default
        allowedNames: ['self'] // Allow `const self = this`; `[]` by default
      }
    ],
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: true
      }
    ],
    'prefer-arrow-callback': 'error',
    'no-duplicate-imports': 'error',
    'no-bitwise': 'error',
    // note you must disable the base rule as it can report incorrect errors
    'no-empty-function': 'off',
    'no-invalid-this': 'off',
    'no-magic-numbers': 'off',
    'no-multiple-empty-lines': 'error',
    // 'no-underscore-dangle': 'error',
    'no-template-curly-in-string': 'error',
    'prefer-object-spread': 'error',
    'prefer-template': 'error'
  }
};
