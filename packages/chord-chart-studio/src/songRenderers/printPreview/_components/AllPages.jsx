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
		songKey,
		dictionary,
		diagramPosition,
		allLines,
		columnsCount,
		columnBreakOnSection,
		documentSize,
		documentMargins,
		fontSize,
	} = props;

	// With diagramPosition 'bottom' the dictionary gets its own trailing page
	// instead of sharing page 1 with the song start, so the song pagination
	// is not affected by the dictionary height.
	const firstPageDictionary =
		diagramPosition === 'bottom' ? '' : dictionary;
	const trailingDictionary = diagramPosition === 'bottom' ? dictionary : '';

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
				{ composer, songKey, dictionary: firstPageDictionary }
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
		songKey,
		firstPageDictionary,
		columnsCount,
		columnBreakOnSection,
		documentSize,
		documentMargins,
		fontSize,
	]);

	const pageCount = allPagesColumns.length + (trailingDictionary ? 1 : 0);

	const allPagesRendered = allPagesColumns.map((pageColumns, index) => {
		return (
			<Page
				key={index}
				pageHeader={
					index === 0 ? (
						<PageHeader
							title={title}
							composer={composer}
							songKey={songKey}
						/>
					) : null
				}
				dictionary={index === 0 ? firstPageDictionary : ''}
				allColumnsLines={padColumns(columnsCount, pageColumns)}
				documentSize={documentSize}
				documentMargins={documentMargins}
				fontSize={fontSize}
				title={title}
				pageNumber={index + 1}
				pageCount={pageCount}
			/>
		);
	});

	if (trailingDictionary && allPagesColumns.length > 0) {
		allPagesRendered.push(
			<Page
				key={'dictionary'}
				dictionary={trailingDictionary}
				allColumnsLines={padColumns(columnsCount)}
				documentSize={documentSize}
				documentMargins={documentMargins}
				fontSize={fontSize}
				title={title}
				pageNumber={pageCount}
				pageCount={pageCount}
			/>
		);
	}

	return <React.Fragment>{allPagesRendered}</React.Fragment>;
}

AllPages.defaultProps = {
	composer: '',
	songKey: '',
	dictionary: '',
	diagramPosition: 'top',
};
AllPages.propTypes = {
	title: PropTypes.string.isRequired,
	composer: PropTypes.string,
	songKey: PropTypes.string,
	dictionary: PropTypes.string,
	diagramPosition: PropTypes.string,
	allLines: PropTypes.arrayOf(PropTypes.string).isRequired,
	columnsCount: PropTypes.number.isRequired,
	columnBreakOnSection: PropTypes.bool.isRequired,
	documentSize: PropTypes.string.isRequired,
	documentMargins: PropTypes.number.isRequired,
	fontSize: PropTypes.number.isRequired,
};

export default AllPages;
