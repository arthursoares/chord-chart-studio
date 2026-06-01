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
		return {
			firstPageHeight: getClientHeight(pageColumnWrapper),
			normalPageHeight: getClientHeight(pageContent),
		};
	};

	return await getDimensionsFromDom(component, measuringFn);
}
