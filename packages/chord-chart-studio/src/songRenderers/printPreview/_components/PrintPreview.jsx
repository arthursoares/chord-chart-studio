import './PrintPreview.scss';

import _pick from 'lodash/pick';
import React from 'react';
import PropTypes from 'prop-types';
import { parseSong } from 'chord-mark';

import { renderAsHtml } from '../../../core/renderSong';
import AllPages from './AllPages';

function PrintPreview(props) {
	const { selectedFile } = props;

	const renderOptions = _pick(props, [
		'transposeValue',
		'accidentalsType',
		'symbolType',

		'chartType',
		'alignChordsWithLyrics',
		'alignBars',
		'autoRepeatChords',
		'expandSectionCopy',

		'showChordDiagrams',
		'diagramPosition',
		'diagramSize',
	]);

	const rendered = renderAsHtml(selectedFile.content || '', {
		...renderOptions,
	});
	const allLines = rendered.match(/(<p.*?>.*?<\/p>)/gm) || [];

	const songStart = rendered.indexOf('<div class="cmSong">');
	const dictionary = songStart > 0 ? rendered.slice(0, songStart) : '';

	let composer = '';
	try {
		composer = parseSong(selectedFile.content || '').composer || '';
	} catch (e) {
		composer = '';
	}

	const classNames = ['printPreview', 'cmTheme-print'];

	return (
		<div className={classNames.join(' ')} data-testid={'printPreview'}>
			<AllPages
				title={selectedFile.title || ''}
				composer={composer}
				dictionary={dictionary}
				allLines={allLines}
				columnsCount={props.columnsCount}
				columnBreakOnSection={props.columnBreakOnSection}
				documentSize={props.documentSize || 'a4'}
				documentMargins={props.documentMargins}
				fontSize={props.fontSize}
			/>
		</div>
	);
}
PrintPreview.propTypes = {
	chartType: PropTypes.string.isRequired,
	selectedFile: PropTypes.object.isRequired,
	columnsCount: PropTypes.number.isRequired,
	columnBreakOnSection: PropTypes.bool.isRequired,
	documentSize: PropTypes.string,
	documentMargins: PropTypes.number.isRequired,
	fontSize: PropTypes.number.isRequired,
};

export default PrintPreview;
