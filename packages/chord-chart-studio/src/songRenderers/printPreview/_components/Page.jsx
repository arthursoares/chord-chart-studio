import React from 'react';
import PropTypes from 'prop-types';

import escapeHTML from '../../../core/escapeHTML';

function Page(props) {
	const {
		pageHeader,
		dictionary,
		allColumnsLines,
		documentSize,
		documentMargins,
		fontSize,
		title,
		pageNumber,
		pageCount,
	} = props;

	const allSectionsRendered = allColumnsLines.map((columnLines, index) => {
		const columnLinesTxt = columnLines.join('');

		return (
			<div
				key={index}
				className={'printPreview-pageColumn'}
				data-testid={'printPreview-pageColumn'}
				dangerouslySetInnerHTML={{ __html: escapeHTML(columnLinesTxt) }}
			/>
		);
	});

	const pageClasses = ['printPreview-page'];
	pageClasses.push('printPreview-page--' + documentSize);
	pageClasses.push('cmSong--fontSize' + fontSize);
	pageClasses.push('cmSong');

	const pageContentWrapperClasses = ['printPreview-pageContentWrapper'];
	pageContentWrapperClasses.push(
		'printPreview-pageContentWrapper--padding' + documentMargins
	);

	return (
		<div
			className={pageClasses.join(' ')}
			data-testid={'printPreview-page'}
		>
			<div
				className={pageContentWrapperClasses.join(' ')}
				data-testid={'printPreview-pageContentWrapper'}
			>
				<div className={'printPreview-pageContent'}>
					{pageHeader}
					{dictionary ? (
						<div
							className={'printPreview-dictionary'}
							dangerouslySetInnerHTML={{
								__html: escapeHTML(dictionary),
							}}
						/>
					) : null}
					<div className={'printPreview-pageColumnWrapper'}>
						{allSectionsRendered}
					</div>
					{pageCount > 0 ? (
						<div className={'printPreview-pageFooter'}>
							<span className={'printPreview-pageFooter-title'}>
								{title}
							</span>
							<span
								className={'printPreview-pageFooter-pageNumber'}
							>
								{'Page ' + pageNumber + ' of ' + pageCount}
							</span>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
Page.defaultProps = {
	allColumnsLines: [],
	dictionary: '',
	title: '',
	pageNumber: 0,
	pageCount: 0,
};
Page.propTypes = {
	pageHeader: PropTypes.element,
	dictionary: PropTypes.string,
	allColumnsLines: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
	documentSize: PropTypes.string.isRequired,
	documentMargins: PropTypes.number.isRequired,
	fontSize: PropTypes.number.isRequired,
	title: PropTypes.string,
	pageNumber: PropTypes.number,
	pageCount: PropTypes.number,
};

export default React.memo(Page);
