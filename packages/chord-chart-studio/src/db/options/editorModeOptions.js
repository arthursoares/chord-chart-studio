const editorModeOptions = {
	edit: ['theme', 'transposeValue', 'preferredAccidentals', 'symbolType'],
	play: [
		'theme',

		'transposeValue',
		'preferredAccidentals',
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

		'columnsCount',

		'fontSize',
	],
	print: [
		'transposeValue',
		'preferredAccidentals',
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

		'columnsCount',
		'columnBreakOnSection',
		'documentSize',
		'documentMargins',

		'fontSize',
	],
	export: [
		'chartFormat',

		'transposeValue',
		'preferredAccidentals',
		'symbolType',

		'chartType',
		'alignChordsWithLyrics',
		'alignBars',
		'autoRepeatChords',
		'expandSectionCopy',
	],
};

export default editorModeOptions;
