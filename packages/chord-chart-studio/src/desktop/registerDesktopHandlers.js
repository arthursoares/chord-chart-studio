import { getStore } from '../state/store';
import { importFile, updateFile } from '../db/files/actions';
import { getOne } from '../db/files/selectors';
import { selectFile } from '../fileManager/_state/actions';
import { getSelectedId } from '../fileManager/_state/selectors';

/**
 * Bridge between the Electron shell (window.desktop, see packages/desktop)
 * and the studio's Redux store.
 *
 * - File → Open…: the main process reads the file and sends it here; the
 *   content is imported as a new file (or reloaded into the file it was
 *   opened into before, so re-opening doesn't pile up duplicates).
 * - File → Save / Save As…: reads the selected file from the store and asks
 *   the main process to write it; the chosen path is remembered per file so
 *   the next save dialog starts from the same location.
 *
 * The on-disk path is deliberately NOT persisted in the store: it is only
 * meaningful within the desktop session that opened the file.
 */

// fileId <-> absolute path on disk, for the lifetime of the window
const pathByFileId = {};
const fileIdByPath = {};

const titleFromPath = (filePath) => {
	const base = filePath.split(/[\\/]/).pop();
	return base.replace(/\.(chordmark|txt)$/i, '') || base;
};

export function _handleFileOpened({ filePath, content }) {
	const store = getStore();

	const knownId = fileIdByPath[filePath];
	if (knownId && getOne(store.getState(), knownId)) {
		store.dispatch(updateFile(knownId, { content }));
		store.dispatch(selectFile(knownId));
		return;
	}

	store.dispatch(importFile(titleFromPath(filePath), content));

	const id = getSelectedId(store.getState());
	if (id) {
		pathByFileId[id] = filePath;
		fileIdByPath[filePath] = id;
	}
}

export async function _handleSaveFile() {
	const state = getStore().getState();
	const id = getSelectedId(state);
	const file = id ? getOne(state, id) : undefined;
	if (!file) return;

	const result = await window.desktop.saveFile({
		content: file.content,
		defaultPath: pathByFileId[id] || `${file.title}.chordmark`,
	});
	if (result && result.filePath) {
		pathByFileId[id] = result.filePath;
		fileIdByPath[result.filePath] = id;
	}
}

export default function registerDesktopHandlers() {
	const desktop = window.desktop;
	if (!desktop || !desktop.isDesktop) return;

	desktop.onFileOpened(_handleFileOpened);
	desktop.onSaveFile(_handleSaveFile);
	// dialog:saveFile always prompts, so Save As is the same flow as Save
	desktop.onSaveFileAs(_handleSaveFile);
}
