import './PrintPreview.scss';

import _pick from 'lodash/pick';
import React from 'react';
import PropTypes from 'prop-types';
import { parseSong } from 'chord-mark';

import { renderAsHtml } from '../../../core/renderSong';
import AllPages from './AllPages';

// eslint-disable-next-line complexity
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

		'layoutMode',
		'barsPerLine',
		'printChordsDuration',
	]);

	const rendered = renderAsHtml(selectedFile.content || '', {
		...renderOptions,
	});
	const allLines = rendered.match(/(<p.*?>.*?<\/p>)/gm) || [];

	const songStart = rendered.indexOf('<div class="cmSong">');
	const dictionary = songStart > 0 ? rendered.slice(0, songStart) : '';

	let composer = '';
	let songKey = '';
	try {
		const parsed = parseSong(selectedFile.content || '');
		composer = parsed.composer || '';
		songKey =
			parsed.allKeys?.explicit?.[0]?.string ||
			parsed.allKeys?.auto?.string ||
			'';
	} catch (e) {
		composer = '';
		songKey = '';
	}

	const classNames = ['printPreview', 'cmTheme-print'];

	const documentSize = props.documentSize || 'a4';

	return (
		<div className={classNames.join(' ')} data-testid={'printPreview'}>
			<style>{`@page { size: ${cssPageSize[documentSize] || 'A4'}; margin: 0; }`}</style>
			<AllPages
				title={selectedFile.title || ''}
				composer={composer}
				songKey={songKey}
				dictionary={dictionary}
				allLines={allLines}
				columnsCount={props.columnsCount}
				columnBreakOnSection={props.columnBreakOnSection}
				documentSize={documentSize}
				documentMargins={props.documentMargins}
				fontSize={props.fontSize}
			/>
		</div>
	);
}

// Pin the printed page size to the previewed page size (with
// preferCSSPageSize, the PDF export then paginates exactly like the preview
// instead of letting the print engine re-flow the pages).
const cssPageSize = {
	a4: 'A4',
	'a4-landscape': 'A4 landscape',
	letter: 'letter',
	'letter-landscape': 'letter landscape',
	booxmax2pro: '698px 930px',
};
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
