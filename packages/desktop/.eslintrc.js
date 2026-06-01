/* eslint-env node */
'use strict';

module.exports = {
	env: {
		node: true,
		es2020: true,
	},
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'script',
	},
	extends: ['eslint:recommended'],
	rules: {
		// Prettier owns indentation/formatting; eslint's indent rule conflicts with it.
		indent: 'off',
		'linebreak-style': ['error', 'unix'],
		'max-len': ['error', { code: 150 }],
		'max-lines': [
			'error',
			{ max: 400, skipBlankLines: true, skipComments: true },
		],
		semi: ['error', 'always'],
		'no-shadow': ['error', { builtinGlobals: true }],
	},
	overrides: [
		{
			// Vite configs use ESM
			files: ['vite.*.config.js'],
			parserOptions: {
				sourceType: 'module',
			},
		},
	],
};
