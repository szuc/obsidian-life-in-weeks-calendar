import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
	js.configs.recommended,
	{
		ignores: ['node_modules/', 'main.js', 'coverage/'],
	},
	{
		files: ['**/*.ts', '**/*.js'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
			},
			ecmaVersion: 2020,
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			...tseslint.configs.recommended.rules,
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-prototype-builtins': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				sourceType: 'module',
			},
			globals: {
				...globals.browser,
			},
		},
		plugins: {
			svelte: sveltePlugin,
			'@typescript-eslint': tseslint,
		},
		rules: {
			...sveltePlugin.configs.recommended.rules,
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
		},
	},
	{
		files: ['**/*.mjs'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	{
		files: ['**/*.test.ts', '**/*.spec.ts'],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
];
