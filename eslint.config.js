const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: ['test/**', 'dev/**', 'lib/**']
    },
    js.configs.recommended,
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                $: 'readonly',
                jQuery: 'readonly'
            }
        },
        rules: {
            'no-console': 0,
            quotes: [2, 'single', { avoidEscape: true }]
        }
    },
    {
        files: ['webpack.config.js', 'eslint.config.js', 'examples/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: globals.node
        },
        rules: {
            'no-console': 0,
            quotes: [2, 'single', { avoidEscape: true }]
        }
    }
];
