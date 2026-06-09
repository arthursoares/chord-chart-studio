jest.mock('uuid');

import { v4 as uuidv4 } from 'uuid';

import { createStore, getStore } from '../../../src/state/store';
import registerDesktopHandlers, {
	_handleFileOpened,
	_handleSaveFile,
} from '../../../src/desktop/registerDesktopHandlers';
import { getSelectedId } from '../../../src/fileManager/_state/selectors';
import { getOne } from '../../../src/db/files/selectors';

let nextUuid = 0;
uuidv4.mockImplementation(() => 'uuid-' + nextUuid++);

const buildDesktopMock = () => ({
	isDesktop: true,
	openFile: jest.fn(),
	saveFile: jest.fn().mockResolvedValue(null),
	exportPdf: jest.fn(),
	onOpenFile: jest.fn(),
	onSaveFile: jest.fn(),
	onSaveFileAs: jest.fn(),
	onFileOpened: jest.fn(),
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
