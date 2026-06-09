/* eslint-env node */
'use strict';

const {
	app,
	BrowserWindow,
	Menu,
	dialog,
	ipcMain,
	net,
	protocol,
	shell,
	session,
} = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Optional dev aid: expose a CDP endpoint when CCS_REMOTE_DEBUG is set
// (e.g. CCS_REMOTE_DEBUG=9222). Harmless when the variable is absent.
if (process.env.CCS_REMOTE_DEBUG) {
	app.commandLine.appendSwitch(
		'remote-debugging-port',
		process.env.CCS_REMOTE_DEBUG
	);
}

// Custom protocol used to serve the built studio in production.
// Registering a custom scheme lets window.location.pathname be a clean '/'
// so the studio's History-based router resolves routes correctly.
const PROTOCOL = 'app';
const PROTOCOL_HOST = 'ccs';

/**
 * Resolve the filesystem root of the studio build directory.
 *
 * In production the whole `build/` folder is placed next to the asar as an
 * extraResource (see forge.config.js → packagerConfig.extraResource).
 * In development/test we point at the workspace build directory.
 */
function getStudioBuildRoot() {
	if (app.isPackaged) {
		return path.join(process.resourcesPath, 'build');
	}
	// When run directly with `electron` (e.g. the headless test), __dirname is
	// the compiled output directory (.vite/build), so we walk up to the
	// monorepo root.
	const monoRoot = path.join(__dirname, '..', '..', '..');
	return path.join(monoRoot, 'packages', 'chord-chart-studio', 'build');
}

// ---------------------------------------------------------------------------
// Custom protocol registration (must happen before app is ready)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Window management
// ---------------------------------------------------------------------------

let mainWindow = null;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		title: 'Chord Chart Studio',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			webSecurity: true,
		},
	});

	if (isDev) {
		mainWindow.loadURL('http://localhost:5173');
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadURL(`${PROTOCOL}://${PROTOCOL_HOST}/`);
	}

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	return mainWindow;
}

// ---------------------------------------------------------------------------
// Content Security Policy + protocol handler
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
	const buildRoot = getStudioBuildRoot();

	// Register the custom protocol to serve the studio build.
	// app://ccs/  →  buildRoot/index.html
	// app://ccs/assets/foo.js  →  buildRoot/assets/foo.js
	protocol.handle(PROTOCOL, (request) => {
		const url = new URL(request.url);
		// Strip the host prefix and resolve to a file inside buildRoot
		let relPath = url.pathname;
		// Normalise: '/' → '/index.html'
		if (relPath === '/' || relPath === '') {
			relPath = '/index.html';
		}
		const filePath = path.join(buildRoot, relPath);
		return net.fetch(pathToFileURL(filePath).toString());
	});

	// Apply a strict CSP.  The custom protocol is treated as 'self'.
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [
					[
						"default-src 'self' app:",
						"script-src 'self' app: 'unsafe-inline' https://www.googletagmanager.com",
						"style-src 'self' app: 'unsafe-inline' https://fonts.googleapis.com",
						"font-src 'self' app: https://fonts.gstatic.com",
						"img-src 'self' app: data: blob:",
						"connect-src 'self' app: https://www.google-analytics.com",
						"worker-src 'none'",
					].join('; '),
				],
			},
		});
	});

	createWindow();
	buildMenu();

	app.on('activate', () => {
		// macOS: re-create the window when the dock icon is clicked and no
		// windows are open.
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	// On macOS keep the app running until the user explicitly quits via Cmd+Q.
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

/**
 * Open a .chordmark file via the native dialog and return its contents.
 * The renderer calls window.desktop.openFile() which sends this IPC message.
 */
ipcMain.handle('dialog:openFile', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
		title: 'Open Chord Chart',
		filters: [
			{ name: 'Chord Charts', extensions: ['chordmark', 'txt'] },
			{ name: 'All Files', extensions: ['*'] },
		],
		properties: ['openFile'],
	});

	if (canceled || filePaths.length === 0) {
		return null;
	}

	const filePath = filePaths[0];

	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		return { filePath, content };
	} catch (err) {
		dialog.showErrorBox(
			'Open failed',
			`Could not read file:\n${err.message}`
		);
		return null;
	}
});

/**
 * Save content to a .chordmark file via the native save dialog.
 * The renderer calls window.desktop.saveFile({ content, defaultPath }).
 */
ipcMain.handle('dialog:saveFile', async (_event, { content, defaultPath }) => {
	const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
		title: 'Save Chord Chart',
		defaultPath: defaultPath || 'song.chordmark',
		filters: [
			{ name: 'Chord Charts', extensions: ['chordmark'] },
			{ name: 'All Files', extensions: ['*'] },
		],
	});

	if (canceled || !filePath) {
		return null;
	}

	try {
		fs.writeFileSync(filePath, content, 'utf-8');
		return { filePath };
	} catch (err) {
		dialog.showErrorBox(
			'Save failed',
			`Could not write file:\n${err.message}`
		);
		return null;
	}
});

/**
 * Open a .chordmark file from an explicit path, without a dialog.
 * The renderer calls window.desktop.openPath(filePath); the content is
 * delivered through the same 'file:opened' event as the File → Open… menu,
 * so both entry points converge on one renderer code path. Also the hook
 * for opening files passed on the command line / "Open With".
 */
const OPENABLE_EXTENSIONS = ['.chordmark', '.txt'];

ipcMain.handle('file:openPath', async (_event, filePath) => {
	if (typeof filePath !== 'string') {
		return null;
	}
	if (!OPENABLE_EXTENSIONS.includes(path.extname(filePath).toLowerCase())) {
		return null;
	}

	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		mainWindow.webContents.send('file:opened', { filePath, content });
		return { filePath };
	} catch (err) {
		dialog.showErrorBox(
			'Open failed',
			`Could not read file:\n${err.message}`
		);
		return null;
	}
});

/**
 * Export the current view as a PDF via webContents.printToPDF().
 * The renderer drives this (after switching itself to the print view) with
 * the song title as suggested file name and the page setup matching the
 * preview. preferCSSPageSize hands pagination to the preview's @page rule,
 * so the exported pages are exactly the previewed pages.
 */
const PDF_PAGE_SIZES = ['A4', 'Letter'];

ipcMain.handle('dialog:exportPdf', async (_event, opts = {}) => {
	const defaultPath =
		typeof opts.defaultPath === 'string' && opts.defaultPath
			? opts.defaultPath
			: 'chord-chart.pdf';
	const pageSize = PDF_PAGE_SIZES.includes(opts.pageSize)
		? opts.pageSize
		: 'A4';
	const landscape = opts.landscape === true;

	const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
		title: 'Export as PDF',
		defaultPath,
		filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
	});

	if (canceled || !filePath) {
		return null;
	}

	try {
		const pdfData = await mainWindow.webContents.printToPDF({
			printBackground: true,
			pageSize,
			landscape,
			preferCSSPageSize: true,
		});
		fs.writeFileSync(filePath, pdfData);
		shell.openPath(filePath);
		return { filePath };
	} catch (err) {
		dialog.showErrorBox(
			'Export failed',
			`Could not export PDF:\n${err.message}`
		);
		return null;
	}
});

// ---------------------------------------------------------------------------
// Application Menu
// ---------------------------------------------------------------------------

function buildMenu() {
	const isMac = process.platform === 'darwin';

	const fileMenu = {
		label: 'File',
		submenu: [
			{
				label: 'Open…',
				accelerator: 'CmdOrCtrl+O',
				async click() {
					if (!mainWindow) return;
					const { canceled, filePaths } = await dialog.showOpenDialog(
						mainWindow,
						{
							title: 'Open Chord Chart',
							filters: [
								{
									name: 'Chord Charts',
									extensions: ['chordmark', 'txt'],
								},
								{ name: 'All Files', extensions: ['*'] },
							],
							properties: ['openFile'],
						}
					);
					if (canceled || filePaths.length === 0) return;
					try {
						const content = fs.readFileSync(filePaths[0], 'utf-8');
						mainWindow.webContents.send('file:opened', {
							filePath: filePaths[0],
							content,
						});
					} catch (err) {
						dialog.showErrorBox(
							'Open failed',
							`Could not read file:\n${err.message}`
						);
					}
				},
			},
			{
				label: 'Save',
				accelerator: 'CmdOrCtrl+S',
				click() {
					if (!mainWindow) return;
					// Tells the renderer to initiate save with the current content.
					mainWindow.webContents.send('menu:saveFile');
				},
			},
			{
				label: 'Save As…',
				accelerator: 'CmdOrCtrl+Shift+S',
				click() {
					if (!mainWindow) return;
					mainWindow.webContents.send('menu:saveFileAs');
				},
			},
			{ type: 'separator' },
			{
				label: 'Export PDF',
				accelerator: 'CmdOrCtrl+Shift+E',
				click() {
					if (!mainWindow) return;
					// The renderer switches itself to the print view and
					// calls back into dialog:exportPdf with the song title
					// and the page setup matching the preview.
					mainWindow.webContents.send('menu:exportPdf');
				},
			},
			{ type: 'separator' },
			isMac ? { role: 'close' } : { role: 'quit' },
		],
	};

	const viewMenu = {
		label: 'View',
		submenu: [
			{ role: 'reload' },
			{ role: 'forceReload' },
			{ role: 'toggleDevTools' },
			{ type: 'separator' },
			{ role: 'resetZoom' },
			{ role: 'zoomIn' },
			{ role: 'zoomOut' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' },
		],
	};

	const macAppMenu = {
		label: app.name,
		submenu: [
			{ role: 'about' },
			{ type: 'separator' },
			{ role: 'services' },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideOthers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' },
		],
	};

	const windowSubmenuExtra = isMac
		? [
				{ type: 'separator' },
				{ role: 'front' },
				{ type: 'separator' },
				{ role: 'window' },
			]
		: [{ role: 'close' }];

	const windowMenu = {
		label: 'Window',
		submenu: [
			{ role: 'minimize' },
			{ role: 'zoom' },
			...windowSubmenuExtra,
		],
	};

	// Standard Edit menu — without it, the clipboard accelerators
	// (Cmd/Ctrl+C/V/X/A, undo/redo) don't work in the renderer.
	const editMenu = {
		label: 'Edit',
		submenu: [
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			...(isMac
				? [
						{ role: 'pasteAndMatchStyle' },
						{ role: 'delete' },
						{ role: 'selectAll' },
					]
				: [
						{ role: 'delete' },
						{ type: 'separator' },
						{ role: 'selectAll' },
					]),
		],
	};

	const template = [
		...(isMac ? [macAppMenu] : []),
		fileMenu,
		editMenu,
		viewMenu,
		windowMenu,
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
