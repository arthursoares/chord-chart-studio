/* eslint-env node */
module.exports = {
	testEnvironment: 'jsdom',
	rootDir: __dirname,

	collectCoverage: true,
	collectCoverageFrom: ['<rootDir>/packages/chord-chart-studio/src/**/*.js'],
	coverageDirectory: '<rootDir>/coverage',
	coverageReporters: ['json', 'lcov', 'text', 'clover'],
	coverageThreshold: {
		global: {
			branches: 90,
			functions: 90,
			lines: 90,
			statements: 90,
		},
	},

	transform: {
		'\\.js$': 'babel-jest',
		'\\.jsx$': 'babel-jest',
		'\\.txt': 'jest-text-transformer',
		'\\.svg': 'jest-text-transformer',
	},
	// whitelisting local modules in the node_modules folder.
	// The first pattern ignores all node_modules within rootDir except chord-mark/chord-symbol sources.
	// The second pattern ignores non-chord-* node_modules inside sibling packages (e.g. chord-mark's
	// own hoisted node_modules for core-js etc.) that live outside rootDir and would otherwise be
	// incorrectly transformed by babel's useBuiltIns:'usage' polyfill injection, causing core-js
	// initialisation failures in Jest. chord-symbol inside chord-mark's node_modules is still
	// transformed so its ESM source is handled correctly.
	transformIgnorePatterns: [
		'<rootDir>.*(node_modules)(?!.*chord-(symbol|mark).*).*$',
		'.*chord-mark.*(node_modules)(?!.*chord-(symbol|mark).*).*$',
	],

	moduleNameMapper: {
		'\\.(css|scss)$': '<rootDir>/tests/styleMock.js',
		'\\.(png)$': '<rootDir>/tests/assetMock.js',
		'.*\\.txt\\?raw': 'jest-text-transformer',
	},
};
