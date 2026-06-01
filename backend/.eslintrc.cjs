module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Enforce named exports across the backend
    'import/no-default-export': 'error',
    // Conflicts with no-default-export — a single named export is fine
    'import/prefer-default-export': 'off',
    // Native ESM requires explicit file extensions on relative imports
    'import/extensions': ['error', 'ignorePackages', { js: 'always' }],

    // Sequelize hooks mutate the model instance by design
    'no-param-reassign': ['error', { props: false }],
    // console.log is fine in a server app
    'no-console': 'off',
    // Allow _req / _res underscore prefix for unused params
    'no-underscore-dangle': 'off',
    'import/no-extraneous-dependencies': 'off',
  },
};
