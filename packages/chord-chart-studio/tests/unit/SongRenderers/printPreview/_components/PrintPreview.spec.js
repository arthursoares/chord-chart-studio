jest.mock(
	'../../../../../src/songRenderers/printPreview/helpers/getAllLinesHeight'
);
jest.mock(
	'../../../../../src/songRenderers/printPreview/helpers/getPagesHeight'
);

// Mock dompurify so escapeHTML works in jsdom without a real window.DOMParser
jest.mock('dompurify', () => ({ sanitize: (html) => html }));

import _ from 'lodash';
import React from 'react';

import { render, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import '@testing-library/jest-dom';

import PrintPreview from '../../../../../src/songRenderers/printPreview/_components/PrintPreview';
import getAllLinesHeight from '../../../../../src/songRenderers/printPreview/helpers/getAllLinesHeight';
import getPagesHeight from '../../../../../src/songRenderers/printPreview/helpers/getPagesHeight';

afterEach(cleanup);

describe('PrintPreview', () => {
	let props = {};

	// 200 lines
	const selectedFile = {
		content: '<div class="cmLine">myVerse</div>\n'.repeat(199),
		title: 'myTitle',
	};

	// page 1 => 3 cols => (600/20) = 30 lines per col => 90 lines capacity => 90 used
	// page 2 => 3 cols => (800/20) = 40 lines per col => 120 lines capacity => 110 used
	getAllLinesHeight.mockReturnValue(
		new Array(selectedFile.content.length).fill(20)
	);
	getPagesHeight.mockReturnValue({
		firstPageHeight: 600,
		normalPageHeight: 800,
	});

	beforeEach(() => {
		props = {
			selectedFile: _.cloneDeep(selectedFile),
			chartType: 'all',

			columnsCount: 3,
			columnBreakOnSection: true,
			documentMargins: 3,

			fontSize: 1,
		};
	});

	describe('Layout', () => {
		test('Should spread all lines over pages and columns', async () => {
			let result = {};

			await act(async () => {
				result = render(<PrintPreview {...props} />);
			});

			const { getAllByTestId } = result;

			const allPages = getAllByTestId('printPreview-page');

			expect(allPages.length).toBe(2);

			expect(allPages[0].querySelectorAll('.cmLine').length).toBe(90);
			expect(allPages[1].querySelectorAll('.cmLine').length).toBe(110);

			const allColumns = getAllByTestId('printPreview-pageColumn');

			expect(allColumns.length).toBe(6);

			expect(allColumns[0].querySelectorAll('.cmLine').length).toBe(30);
			expect(allColumns[1].querySelectorAll('.cmLine').length).toBe(30);
			expect(allColumns[2].querySelectorAll('.cmLine').length).toBe(30);
			expect(allColumns[3].querySelectorAll('.cmLine').length).toBe(40);
			expect(allColumns[4].querySelectorAll('.cmLine').length).toBe(40);
			expect(allColumns[5].querySelectorAll('.cmLine').length).toBe(30);
		});
	});

	describe('Empty document', () => {
		test('should survive with empty document', async () => {
			let result = {};

			await act(async () => {
				result = render(<PrintPreview {...props} selectedFile={{}} />);
			});

			const { getByTestId } = result;

			const preview = getByTestId('printPreview');

			expect(preview).toBeInstanceOf(Element);
			expect(preview).toBeInTheDocument();
		});
	});

	describe('pageHeader', () => {
		test('Should render pageHeader on first page only', async () => {
			let result = {};

			await act(async () => {
				result = render(<PrintPreview {...props} />);
			});

			const { getAllByTestId } = result;

			const allPages = getAllByTestId('printPreview-page');

			expect(
				allPages[0].querySelector('.printPreview-pageHeader')
			).toBeInstanceOf(Element);
			expect(
				allPages[1].querySelector('.printPreview-pageHeader')
			).toBeNull();
		});
	});

	describe('Composer header', () => {
		test('Should render composer subtitle on first page when content has composer directive', async () => {
			let result = {};

			const fileWithComposer = {
				content: 'composer John Doe\n_mySong\nA\n',
				title: 'My Song',
			};

			await act(async () => {
				result = render(
					<PrintPreview {...props} selectedFile={fileWithComposer} />
				);
			});

			const { getAllByTestId } = result;

			const allPages = getAllByTestId('printPreview-page');

			const pageComposer = allPages[0].querySelector(
				'.printPreview-pageComposer'
			);
			expect(pageComposer).toBeInstanceOf(Element);
			expect(pageComposer.textContent).toBe('John Doe');
		});

		test('Should not render composer subtitle when content has no composer directive', async () => {
			let result = {};

			const fileWithoutComposer = {
				content: '_mySong\nA\n',
				title: 'My Song',
			};

			await act(async () => {
				result = render(
					<PrintPreview
						{...props}
						selectedFile={fileWithoutComposer}
					/>
				);
			});

			const { getAllByTestId } = result;

			const allPages = getAllByTestId('printPreview-page');

			expect(
				allPages[0].querySelector('.printPreview-pageComposer')
			).toBeNull();
		});
	});

	describe('Key header', () => {
		test('Should render key line on first page when content has explicit key directive', async () => {
			let result = {};

			const fileWithKey = {
				content: 'key G\n_mySong\nG C D\n',
				title: 'My Song',
			};

			await act(async () => {
				result = render(
					<PrintPreview {...props} selectedFile={fileWithKey} />
				);
			});

			const { getAllByTestId } = result;

			const allPages = getAllByTestId('printPreview-page');

			const keyEl = allPages[0].querySelector('.printPreview-pageKey');
			expect(keyEl).toBeInstanceOf(Element);
			expect(keyEl.textContent).toBe('Key: G');
		});

		test('Should not render key line when content has no key directive and key cannot be auto-detected', async () => {
			let result = {};

			const fileWithoutKey = {
				content: '_mySong\n',
				title: 'My Song',
			};

			await act(async () => {
				result = render(
					<PrintPreview {...props} selectedFile={fileWithoutKey} />
				);
			});

			const { getAllByTestId } = result;

			const allPages = getAllByTestId('printPreview-page');

			expect(
				allPages[0].querySelector('.printPreview-pageKey')
			).toBeNull();
		});
	});

	describe('Chord dictionary', () => {
		test('Should render chord dictionary on first page only when showChordDiagrams is dictionary', async () => {
			let result = {};

			// Content with a chord definition that will produce a dictionary
			const fileWithDiagrams = {
				content: 'chord C x32010\n_Verse\nC\n_hello world\n',
				title: 'My Song',
			};

			await act(async () => {
				result = render(
					<PrintPreview
						{...props}
						selectedFile={fileWithDiagrams}
						showChordDiagrams={'dictionary'}
						diagramPosition={'top'}
						diagramSize={'medium'}
					/>
				);
			});

			const { getAllByTestId } = result;

			const allPages = getAllByTestId('printPreview-page');

			// Dictionary should be on first page
			const firstPageDict = allPages[0].querySelector(
				'.printPreview-dictionary'
			);
			expect(firstPageDict).toBeInstanceOf(Element);

			// The chord dictionary SVG container should be inside
			expect(
				firstPageDict.querySelector('.cmChordDictionary')
			).toBeInstanceOf(Element);
		});

		test('Should not render chord dictionary when showChordDiagrams is none', async () => {
			let result = {};

			const fileWithDiagrams = {
				content: 'chord C x32010\n_Verse\nC\n_hello world\n',
				title: 'My Song',
			};

			await act(async () => {
				result = render(
					<PrintPreview
						{...props}
						selectedFile={fileWithDiagrams}
						showChordDiagrams={'none'}
					/>
				);
			});

			const { getAllByTestId } = result;

			const allPages = getAllByTestId('printPreview-page');

			expect(
				allPages[0].querySelector('.printPreview-dictionary')
			).toBeNull();
		});
	});

	describe('Formatting options', () => {
		test('Should add relevant classes to support formatting options', async () => {
			let result = {};

			await act(async () => {
				result = render(<PrintPreview {...props} />);
			});

			const { getAllByTestId, rerender } = result;

			let allPages = getAllByTestId('printPreview-page');
			expect(allPages[0]).toHaveClass('printPreview-page--a4');
			expect(allPages[0]).toHaveClass('cmSong--fontSize1');

			let allPageContentWrappers = getAllByTestId(
				'printPreview-pageContentWrapper'
			);
			expect(allPageContentWrappers[0]).toHaveClass(
				'printPreview-pageContentWrapper--padding3'
			);

			await act(async () => {
				rerender(
					<PrintPreview
						{...props}
						documentSize={'ipad'}
						documentMargins={-2}
						fontSize={-4}
					/>
				);
			});

			allPages = getAllByTestId('printPreview-page');
			expect(allPages[0]).toHaveClass('printPreview-page--ipad');
			expect(allPages[0]).toHaveClass('cmSong--fontSize-4');

			allPageContentWrappers = getAllByTestId(
				'printPreview-pageContentWrapper'
			);
			expect(allPageContentWrappers[0]).toHaveClass(
				'printPreview-pageContentWrapper--padding-2'
			);
		});
	});
});
