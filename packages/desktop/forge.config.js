/* eslint-env node */
const path = require('path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
	packagerConfig: {
		asar: true,
		name: 'Chord Chart Studio',
		executableName: 'chord-chart-studio',
		extraResource: [path.join(__dirname, '../chord-chart-studio/build')],
	},
	rebuildConfig: {},
	makers: [
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin', 'linux', 'win32'],
		},
		{
			name: '@electron-forge/maker-dmg',
			platforms: ['darwin'],
			config: {
				format: 'ULFO',
			},
		},
		{
			name: '@electron-forge/maker-squirrel',
			platforms: ['win32'],
			config: {
				name: 'chord_chart_studio',
			},
		},
	],
	plugins: [
		{
			name: '@electron-forge/plugin-vite',
			config: {
				build: [
					{
						entry: 'src/main.js',
						config: 'vite.main.config.js',
						target: 'main',
					},
					{
						entry: 'src/preload.js',
						config: 'vite.preload.config.js',
						target: 'preload',
					},
				],
				renderer: [],
			},
		},
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
};
