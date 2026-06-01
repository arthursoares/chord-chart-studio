jest.mock('../../../../../src/songRenderers/printPreview/helpers/element');

import { getClientHeight } from '../../../../../src/songRenderers/printPreview/helpers/element';

import getPagesHeight from '../../../../../src/songRenderers/printPreview/helpers/getPagesHeight';

describe('getPagesHeight', () => {
	test('Module', () => {
		expect(getPagesHeight).toBeInstanceOf(Function);
	});
});

describe('getPagesHeight', () => {
	test('should return firstPageHeight (column wrapper) and normalPageHeight (content minus footer)', () => {
		// Distinct heights per element so we can assert the footer is excluded
		// from normalPageHeight (the footer occupies space on every page).
		getClientHeight.mockImplementation((el) => {
			const className = (el && el.className) || '';
			if (className.includes('pageColumnWrapper')) return 543;
			if (className.includes('pageFooter')) return 23;
			if (className.includes('pageContent')) return 1000;
			return 0;
		});

		return getPagesHeight('myTitle', {
			columnsCount: 2,
			documentSize: 'a4',
			documentMargins: 3,
			fontSize: 0,
		}).then(({ normalPageHeight, firstPageHeight }) => {
			expect(firstPageHeight).toBe(543);
			expect(normalPageHeight).toBe(1000 - 23);
		});
	});
});
