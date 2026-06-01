import React, { useState, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';

import Page from './Page';
import PageHeader from './PageHeader';

import mapLinesToColumns from '../helpers/mapLinesToColumns';
import getAllLinesHeight from '../helpers/getAllLinesHeight';
import getPagesHeight from '../helpers/getPagesHeight';
import padColumns from '../helpers/padColumns';

function AllPages(props) {
	const [allPagesColumns, setAllPagesColumns] = useState([]);

	const {
		title,
		composer,
		dictionary,
		allLines,
		columnsCount,
		columnBreakOnSection,
		documentSize,
		documentMargins,
		fontSize,
	} = props;

	useLayoutEffect(() => {
		const getDimensions = async () => {
			const pageOptions = {
				columnsCount,
				documentSize,
				documentMargins,
				fontSize,
			};

			const allLinesHeight = await getAllLinesHeight(
				allLines,
				pageOptions
			);

			const { normalPageHeight, firstPageHeight } = await getPagesHeight(
				title,
				pageOptions,
				{ composer, dictionary }
			);

			const allLinesWithHeight = allLines.map((line, index) => ({
				content: line,
				height: allLinesHeight[index],
			}));

			const mapped = mapLinesToColumns(allLinesWithHeight, {
				columnsCount,
				columnBreakOnSection,
				normalPageHeight,
				firstPageHeight,
			});

			setAllPagesColumns(mapped);
		};
		getDimensions();
	}, [
		allLines,
		title,
		composer,
		dictionary,
		columnsCount,
		columnBreakOnSection,
		documentSize,
		documentMargins,
		fontSize,
	]);

	const allPagesRendered = allPagesColumns.map((pageColumns, index) => {
		return (
			<Page
				key={index}
				pageHeader={
					index === 0 ? (
						<PageHeader title={title} composer={composer} />
					) : null
				}
				dictionary={index === 0 ? dictionary : ''}
				allColumnsLines={padColumns(columnsCount, pageColumns)}
				documentSize={documentSize}
				documentMargins={documentMargins}
				fontSize={fontSize}
			/>
		);
	});

	return <React.Fragment>{allPagesRendered}</React.Fragment>;
}

AllPages.defaultProps = {
	composer: '',
	dictionary: '',
};
AllPages.propTypes = {
	title: PropTypes.string.isRequired,
	composer: PropTypes.string,
	dictionary: PropTypes.string,
	allLines: PropTypes.arrayOf(PropTypes.string).isRequired,
	columnsCount: PropTypes.number.isRequired,
	columnBreakOnSection: PropTypes.bool.isRequired,
	documentSize: PropTypes.string.isRequired,
	documentMargins: PropTypes.number.isRequired,
	fontSize: PropTypes.number.isRequired,
};

export default AllPages;
