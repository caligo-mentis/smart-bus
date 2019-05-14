module.exports = {
  'env': {
    'node': true
  },

  'rules': {
    /* Errors */

    'semi': 'error',
    'eqeqeq': 'error',
    'quotes': ['error', 'single'],
    'camelcase': ['error', { 'properties': 'never' }],
    // 'comma-dangle': 'error',

    // 'max-len': ['error', 80, { 'ignoreUrls': true }],
    'one-var': ['error', { 'initialized': 'never', 'uninitialized': 'always' }],
    'eol-last': 'error',
    'spaced-comment': ['error', 'always'],
    'keyword-spacing': 'error',
    'space-before-blocks': ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', {
      'anonymous': 'never',
      'named': 'never'
    }],

    'no-eval': 'error',
    'no-with': 'error',
    'no-empty': 'error',
    'no-undef': 'error',
    'no-debugger': 'error',
    'no-dupe-keys': 'error',
    'no-dupe-args': 'error',
    'no-redeclare': 'error',
    'no-unused-vars': 'error',
    'no-unreachable': 'error',
    'no-func-assign': 'error',
    'no-const-assign': 'error',
    'no-class-assign': 'error',
    'no-multi-spaces': 'error',
    'no-sparse-arrays': 'error',
    'no-duplicate-case': 'error',
    'no-trailing-spaces': 'error',
    'no-this-before-super': 'error',
    'no-irregular-whitespace': 'error',
    'no-unexpected-multiline': 'error',
    'no-multiple-empty-lines': ['error', { 'max': 1 }],
    'no-empty-character-class': 'error',

    /* Warnings */

    'curly': ['warn', 'multi', 'consistent'],
    'indent': ['warn', 2, { 'SwitchCase': 1 }],

    'use-isnan': 'warn',
    'quote-props': ['warn', 'consistent'],
    'block-scoped-var': 'warn',

    'no-console': 'warn',
    'no-extra-semi': 'warn',
    'no-self-assign': 'warn',
    'no-extra-boolean-cast': 'warn',
    'no-useless-computed-key': 'warn'
  }
};
