// server/.eslintrc.cjs
module.exports = {
    env: {
        node: true,
        es2022: true,
        jest: true,
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'commonjs',
    },
    rules: {
        // Errors
        'no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_|next',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            },
        ],
        'no-console': 'off', // console.log is fine in Node servers
        'eqeqeq': ['error', 'always'],
        'no-var': 'error',
        'prefer-const': 'error',

        // Style enforced by Prettier (disable conflicting rules)
        'no-extra-semi': 'off',
        'quotes': 'off',
        'semi': 'off',
    },
    ignorePatterns: ['node_modules/', 'coverage/', '*.min.js'],
};
