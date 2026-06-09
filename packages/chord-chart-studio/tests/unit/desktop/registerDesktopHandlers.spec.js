jest.mock('uuid');

import { v4 as uuidv4 } from 'uuid';

import { createStore, getStore } from '../../../src/state/store';
import registerDesktopHandlers, {
	_handleFileOpened,
	_handleSaveFile,
	_handleExportPdf,
} from '../../../src/desktop/registerDesktopHandlers';
import { getSelectedId } from '../../../src/fileManager/_state/selectors';
import { getOne } from '../../../src/db/files/selectors';
import { setEditorMode } from '../../../src/ui/layout/app/_state/actions';
import { getEditorMode } from '../../../src/ui/layout/app/_state/selectors';

let nextUuid = 0;
uuidv4.mockImplementation(() => 'uuid-' + nextUuid++);

const buildDesktopMock = () => ({
	isDesktop: true,
	openFile: jest.fn(),
	saveFile: jest.fn().mockResolvedValue(null),
	exportPdf: jest.fn().mockResolvedValue(null),
	onOpenFile: jest.fn(),
	onSaveFile: jest.fn(),
	onSaveFileAs: jest.fn(),
	onFileOpened: jest.fn(),
	onExportPdf: jest.fn(),
});

beforeEach(() => {
	localStorage.clear();
	createStore();
	delete window.desktop;
});

describe('registerDesktopHandlers', () => {
	test('does nothing outside the desktop shell', () => {
		expect(() => registerDesktopHandlers()).not.toThrow();
	});

	test('subscribes to open and save events in the desktop shell', () => {
		const desktop = buildDesktopMock();
		window.desktop = desktop;

		registerDesktopHandlers();

		expect(desktop.onFileOpened).toHaveBeenCalledWith(_handleFileOpened);
		expect(desktop.onSaveFile).toHaveBeenCalledWith(_handleSaveFile);
		expect(desktop.onSaveFileAs).toHaveBeenCalledWith(_handleSaveFile);
		expect(desktop.onExportPdf).toHaveBeenCalledWith(_handleExportPdf);
	});
});

describe('_handleExportPdf', () => {
	test('switches to the print view for the capture, then restores the mode', async () => {
		const desktop = buildDesktopMock();
		window.desktop = desktop;

		getStore().dispatch(setEditorMode('edit'));

		let modeDuringExport;
		desktop.exportPdf.mockImplementation(() => {
			modeDuringExport = getEditorMode(getStore().getState());
			return Promise.resolve(null);
		});

		_handleFileOpened({
			filePath: '/tmp/songs/Chega de Saudade.chordmark',
			content: 'A7.. B7..',
		});
		await _handleExportPdf();

		expect(modeDuringExport).toBe('print');
		expect(getEditorMode(getStore().getState())).toBe('edit');
		expect(desktop.exportPdf).toHaveBeenCalledWith({
			defaultPath: 'Chega de Saudade.pdf',
			pageSize: 'A4',
			landscape: false,
		});
	});

	test('stays in print mode when already there and maps the page-size option', async () => {
		const desktop = buildDesktopMock();
		window.desktop = desktop;

		_handleFileOpened({
			filePath: '/tmp/songs/Outra/Coisa.chordmark',
			content: 'Dm7',
		});
		// importing a file resets the mode to 'edit', so switch after opening
		getStore().dispatch(setEditorMode('print'));

		await _handleExportPdf();

		expect(getEditorMode(getStore().getState())).toBe('print');
		// title comes from the file name; '/' would break the save dialog path
		expect(desktop.exportPdf).toHaveBeenCalledWith({
			defaultPath: 'Coisa.pdf',
			pageSize: 'A4',
			landscape: false,
		});
	});
});

describe('_handleFileOpened', () => {
	test('imports the file content, titled after the file name, and selects it', () => {
		_handleFileOpened({
			filePath: '/tmp/songs/Chega de Saudade.chordmark',
			content: 'A7.. B7..',
		});

		const state = getStore().getState();
		const selectedId = getSelectedId(state);
		const file = getOne(state, selectedId);

		expect(file.title).toBe('Chega de Saudade');
		expect(file.content).toBe('A7.. B7..');
	});

	test('reloads into the same file when the same path is opened again', () => {
		_handleFileOpened({
			filePath: '/tmp/songs/reopened.chordmark',
			content: 'first',
		});
		const firstId = getSelectedId(getStore().getState());

		_handleFileOpened({
			filePath: '/tmp/songs/reopened.chordmark',
			content: 'second',
		});

		const state = getStore().getState();
		expect(getSelectedId(state)).toBe(firstId);
		expect(getOne(state, firstId).content).toBe('second');
	});
});

describe('_handleSaveFile', () => {
	test('sends the selected file content to the shell, defaulting to the title as file name', async () => {
		const desktop = buildDesktopMock();
		window.desktop = desktop;

		_handleFileOpened({
			filePath: '/tmp/songs/my song.chordmark',
			content: 'C.. G..',
		});
		// saving a file opened from disk starts from its on-disk path
		await _handleSaveFile();

		expect(desktop.saveFile).toHaveBeenCalledWith({
			content: 'C.. G..',
			defaultPath: '/tmp/songs/my song.chordmark',
		});
	});

	test('remembers the path picked in the save dialog', async () => {
		const desktop = buildDesktopMock();
		window.desktop = desktop;
		desktop.saveFile.mockResolvedValue({
			filePath: '/tmp/elsewhere/saved.chordmark',
		});

		_handleFileOpened({
			filePath: '/tmp/songs/original.chordmark',
			content: 'Dm7',
		});
		await _handleSaveFile();
		await _handleSaveFile();

		expect(desktop.saveFile).toHaveBeenLastCalledWith({
			content: 'Dm7',
			defaultPath: '/tmp/elsewhere/saved.chordmark',
		});
	});

	test('does nothing when no file is selected', async () => {
		const desktop = buildDesktopMock();
		window.desktop = desktop;

		await _handleSaveFile();

		expect(desktop.saveFile).not.toHaveBeenCalled();
	});
});
