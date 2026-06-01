module.exports = {
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    'airbnb',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react-hooks'],
  rules: {
    // React 17+ new JSX transform
    'react/react-in-jsx-scope': 'off',

    // .js files contain JSX in React Native projects
    'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx'] }],

    // Expo/Metro resolves modules differently — standard Node resolver doesn't know them
    'import/no-unresolved': 'off',

    // StyleSheet.create() objects are defined after the component — idiomatic in RN
    'no-use-before-define': ['error', { functions: true, classes: true, variables: false }],

    // Arrow function components are idiomatic in React Native
    'react/function-component-definition': ['error', {
      namedComponents: 'arrow-function',
      unnamedComponents: 'arrow-function',
    }],

    // prop-types is superseded by TypeScript; not used in this project
    'react/prop-types': 'off',

    // Axios interceptor pattern requires assigning to config properties
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['config', 'acc', 'accumulator', 'req', 'request'],
    }],

    // Expo's <StatusBar style="light" /> accepts a string — correct for Expo
    'react/style-prop-object': 'off',

    // Allow prop spreading (common in RN)
    'react/jsx-props-no-spreading': 'off',

    // RN doesn't use href
    'jsx-a11y/anchor-is-valid': 'off',

    // console.warn/log is acceptable in RN dev
    'no-console': 'warn',

    'import/prefer-default-export': 'off',

    // StyleSheet objects in RN are commonly written with multiple props on one line
    'object-property-newline': 'off',

    // Relax to 120 chars — RN StyleSheet definitions benefit from more breathing room
    'max-len': ['error', { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true }],

    // Less strict curly brace newlines — StyleSheet.create() objects are dense by convention
    'object-curly-newline': ['error', { consistent: true }],

    // One expression per line is too strict for simple Text wrappers in RN
    'react/jsx-one-expression-per-line': 'off',

    // Enforce named exports
    'import/no-default-export': 'error',

  },
};
