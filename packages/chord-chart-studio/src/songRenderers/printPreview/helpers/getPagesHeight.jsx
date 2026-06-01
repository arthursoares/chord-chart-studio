import React from 'react';

import getDimensionsFromDom from './getDimensionsFromDom';
import padColumns from './padColumns';
import { getClientHeight } from './element';

import Page from '../_components/Page';
import PageHeader from '../_components/PageHeader';

export default async function getAllLinesHeight(
	title,
	{ columnsCount, documentSize, documentMargins, fontSize },
	{ composer = '', songKey = '', dictionary = '' } = {}
) {
	const component = (
		<Page
			pageHeader={
				<PageHeader
					title={title}
					composer={composer}
					songKey={songKey}
				/>
			}
			dictionary={dictionary}
			allColumnsLines={padColumns(columnsCount)}
			documentSize={documentSize}
			documentMargins={documentMargins}
			fontSize={fontSize}
			title={title}
			pageNumber={1}
			pageCount={1}
		/>
	);

	const measuringFn = (container) => {
		const pageContent = container.querySelector(
			'.printPreview-pageContent'
		);
		const pageColumnWrapper = container.querySelector(
			'.printPreview-pageColumnWrapper'
		);
		const pageFooter = container.querySelector(
			'.printPreview-pageFooter'
		);
		// The footer occupies space on every page, so the lines available on a
		// normal page is the content height minus the footer. (On the first
		// page the footer is already excluded — firstPageHeight measures the
		// column wrapper, which sits above the footer.)
		const footerHeight = pageFooter ? getClientHeight(pageFooter) : 0;
		return {
			firstPageHeight: getClientHeight(pageColumnWrapper),
			normalPageHeight: getClientHeight(pageContent) - footerHeight,
		};
	};

	return await getDimensionsFromDom(component, measuringFn);
}
