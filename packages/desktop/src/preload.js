/* eslint-env node */
'use strict';

/**
 * Preload script — runs in the renderer's context with Node access, but
 * exposes ONLY a narrow, validated API surface to the renderer via
 * contextBridge.  contextIsolation is ON so the renderer cannot reach Node.
 */

const { contextBridge, ipcRenderer } = require('electron');

// ---------------------------------------------------------------------------
// Allowed IPC channels (allowlist — never expose a generic "invoke any channel")
// ---------------------------------------------------------------------------

const INVOKE_CHANNELS = [
	'dialog:openFile',
	'dialog:saveFile',
	'dialog:exportPdf',
	'file:openPath',
];
const RECEIVE_CHANNELS = [
	'menu:openFile',
	'menu:saveFile',
	'menu:saveFileAs',
	'menu:exportPdf',
	'file:opened',
];

// ---------------------------------------------------------------------------
// Exposed API  →  window.desktop
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('desktop', {
	/**
	 * Open a .chordmark file via the native dialog.
	 * @returns {Promise<{filePath: string, content: string} | null>}
	 */
	openFile() {
		return ipcRenderer.invoke('dialog:openFile');
	},

	/**
	 * Save content to a .chordmark file via the native dialog.
	 * @param {object} opts
	 * @param {string} opts.content       - text content to write
	 * @param {string} [opts.defaultPath] - suggested file name
	 * @returns {Promise<{filePath: string} | null>}
	 */
	saveFile(opts) {
		if (!opts || typeof opts.content !== 'string') {
			return Promise.reject(
				new Error('saveFile: content must be a string')
			);
		}
		return ipcRenderer.invoke('dialog:saveFile', {
			content: opts.content,
			defaultPath:
				typeof opts.defaultPath === 'string'
					? opts.defaultPath
					: undefined,
		});
	},

	/**
	 * Export the current page as a PDF using webContents.printToPDF().
	 * @param {object} [opts]
	 * @param {string} [opts.defaultPath]  - suggested file name
	 * @param {string} [opts.pageSize]     - 'A4' | 'Letter'
	 * @param {boolean} [opts.landscape]
	 * @returns {Promise<{filePath: string} | null>}
	 */
	exportPdf(opts) {
		const safe = {};
		if (opts && typeof opts === 'object') {
			if (typeof opts.defaultPath === 'string') {
				safe.defaultPath = opts.defaultPath;
			}
			if (typeof opts.pageSize === 'string') {
				safe.pageSize = opts.pageSize;
			}
			if (typeof opts.landscape === 'boolean') {
				safe.landscape = opts.landscape;
			}
		}
		return ipcRenderer.invoke('dialog:exportPdf', safe);
	},

	/**
	 * Open a .chordmark file from an explicit path (no dialog). The content
	 * arrives through the same onFileOpened event as the File → Open… menu.
	 * @param {string} filePath
	 * @returns {Promise<{filePath: string} | null>} null if unreadable/refused
	 */
	openPath(filePath) {
		if (typeof filePath !== 'string') {
			return Promise.reject(
				new Error('openPath: filePath must be a string')
			);
		}
		return ipcRenderer.invoke('file:openPath', filePath);
	},

	/**
	 * Register a callback to be called when the main process (menu) triggers
	 * a file-open event.
	 * @param {function} callback
	 * @returns {function} unsubscribe
	 */
	onOpenFile(callback) {
		const handler = (_event, data) => callback(data);
		ipcRenderer.on('menu:openFile', handler);
		return () => ipcRenderer.removeListener('menu:openFile', handler);
	},

	/**
	 * Register a callback for menu Save.
	 * @param {function} callback
	 * @returns {function} unsubscribe
	 */
	onSaveFile(callback) {
		const handler = (_event, data) => callback(data);
		ipcRenderer.on('menu:saveFile', handler);
		return () => ipcRenderer.removeListener('menu:saveFile', handler);
	},

	/**
	 * Register a callback for menu Save As.
	 * @param {function} callback
	 * @returns {function} unsubscribe
	 */
	onSaveFileAs(callback) {
		const handler = (_event, data) => callback(data);
		ipcRenderer.on('menu:saveFileAs', handler);
		return () => ipcRenderer.removeListener('menu:saveFileAs', handler);
	},

	/**
	 * Register a callback for menu Export PDF.
	 * @param {function} callback
	 * @returns {function} unsubscribe
	 */
	onExportPdf(callback) {
		const handler = (_event, data) => callback(data);
		ipcRenderer.on('menu:exportPdf', handler);
		return () => ipcRenderer.removeListener('menu:exportPdf', handler);
	},

	/**
	 * Register a callback for when a file has been opened and its content is
	 * ready (sent back from the main process after dialog:openFile).
	 * @param {function} callback
	 * @returns {function} unsubscribe
	 */
	onFileOpened(callback) {
		const handler = (_event, data) => callback(data);
		ipcRenderer.on('file:opened', handler);
		return () => ipcRenderer.removeListener('file:opened', handler);
	},

	/**
	 * True when running inside Electron.  The renderer can use this to
	 * conditionally show desktop-only UI (e.g. PDF export button).
	 */
	isDesktop: true,
});

// The allowlist constants below document the intended IPC surface.
// Direct ipcRenderer access is never given to the renderer — the only
// communication paths are the four typed methods exposed above.
void INVOKE_CHANNELS;
void RECEIVE_CHANNELS;
