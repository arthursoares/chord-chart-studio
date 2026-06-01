import React from 'react';

import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import PageHeader from '../../../../../src/songRenderers/printPreview/_components/PageHeader';

afterEach(cleanup);

describe('PageHeader', () => {
	describe('title', () => {
		test('Should render the title', () => {
			const { container } = render(<PageHeader title={'My Song'} />);

			const titleEl = container.querySelector('.printPreview-pageTitle');
			expect(titleEl).toBeInstanceOf(Element);
			expect(titleEl.textContent).toBe('My Song');
		});
	});

	describe('composer', () => {
		test('Should render the composer subtitle when composer prop is provided', () => {
			const { container } = render(
				<PageHeader title={'My Song'} composer={'John Doe'} />
			);

			const composerEl = container.querySelector(
				'.printPreview-pageComposer'
			);
			expect(composerEl).toBeInstanceOf(Element);
			expect(composerEl.textContent).toBe('John Doe');
		});

		test('Should not render composer subtitle when composer prop is empty string', () => {
			const { container } = render(
				<PageHeader title={'My Song'} composer={''} />
			);

			expect(
				container.querySelector('.printPreview-pageComposer')
			).toBeNull();
		});

		test('Should not render composer subtitle when composer prop is omitted', () => {
			const { container } = render(<PageHeader title={'My Song'} />);

			expect(
				container.querySelector('.printPreview-pageComposer')
			).toBeNull();
		});
	});

	describe('songKey', () => {
		test('Should render the key element when songKey prop is provided', () => {
			const { container } = render(
				<PageHeader title={'My Song'} songKey={'G'} />
			);

			const keyEl = container.querySelector('.printPreview-pageKey');
			expect(keyEl).toBeInstanceOf(Element);
			expect(keyEl.textContent).toBe('Key: G');
		});

		test('Should not render key element when songKey prop is empty string', () => {
			const { container } = render(
				<PageHeader title={'My Song'} songKey={''} />
			);

			expect(container.querySelector('.printPreview-pageKey')).toBeNull();
		});

		test('Should not render key element when songKey prop is omitted', () => {
			const { container } = render(<PageHeader title={'My Song'} />);

			expect(container.querySelector('.printPreview-pageKey')).toBeNull();
		});
	});
});
