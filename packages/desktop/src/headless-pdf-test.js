/* eslint-env node */
/**
 * Headless smoke-test: load the production studio build via the custom
 * app:// protocol, wait for React to hydrate, export a PDF, then quit.
 *
 * Run via:
 *   node_modules/.bin/electron packages/desktop/src/headless-pdf-test.js
 *
 * Exits 0 if a non-empty PDF was written; exits 1 on any error.
 */
'use strict';

const { app, BrowserWindow, net, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

const PROTOCOL = 'app';
const PROTOCOL_HOST = 'ccs';

// Build root: resolve from __dirname (this file's location) up to the
// monorepo root, then into the studio build output.
const BUILD_ROOT = path.join(
	__dirname,
	'..',
	'..',
	'chord-chart-studio',
	'build'
);

protocol.registerSchemesAsPrivileged([
	{
		scheme: PROTOCOL,
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
			corsEnabled: false,
		},
	},
]);

const outPath = path.join(app.getPath('temp'), 'ccs-headless-test.pdf');

app.whenReady().then(async () => {
	protocol.handle(PROTOCOL, (request) => {
		const url = new URL(request.url);
		let relPath = url.pathname;
		if (relPath === '/' || relPath === '') {
			relPath = '/index.html';
		}
		const filePath = path.join(BUILD_ROOT, relPath);
		return net.fetch(pathToFileURL(filePath).toString());
	});

	const win = new BrowserWindow({
		width: 1280,
		height: 800,
		show: false,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	win.webContents.on('console-message', (_e, _level, message) => {
		// Surface renderer console output so we can diagnose routing errors
		if (message.includes('Error') || message.includes('error')) {
			console.log('[renderer]', message);
		}
	});

	try {
		await win.loadURL(`${PROTOCOL}://${PROTOCOL_HOST}/`);

		// Give React a moment to hydrate and the router to render
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const pdfData = await win.webContents.printToPDF({
			printBackground: true,
			pageSize: 'A4',
		});

		fs.writeFileSync(outPath, pdfData);

		const size = fs.statSync(outPath).size;
		if (size < 1000) {
			console.error(
				`FAIL: PDF too small (${size} bytes), likely empty page`
			);
			app.exit(1);
			return;
		}

		console.log(`OK: PDF written to ${outPath} (${size} bytes)`);
		app.exit(0);
	} catch (err) {
		console.error('FAIL:', err.message);
		app.exit(1);
	}
});
