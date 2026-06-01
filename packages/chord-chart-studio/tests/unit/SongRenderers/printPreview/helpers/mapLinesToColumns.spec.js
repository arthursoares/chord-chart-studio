import mapLinesToColumns from '../../../../../src/songRenderers/printPreview/helpers/mapLinesToColumns';

describe('mapLinesToColumns', () => {
	test('Module', () => {
		expect(mapLinesToColumns).toBeInstanceOf(Function);
	});
});

const chordLine = '<div class="cmChordLine">C F G</div>';
const textLine = '<div class="cmLyricLine">{CONTENT}</div>';
const emptyLine = '<div class="cmEmptyLine"> </div>';

function getTextLine(index) {
	return textLine.replace('{CONTENT}', 'textLine ' + index);
}

function getLines({ from, to }) {
	const count = to - from + 1;
	const lines = new Array(count).fill(
		'<div class="cmLyricLine">{CONTENT}</div>'
	);
	return lines.map((line, index) =>
		line.replace('{CONTENT}', 'myVerse' + (from + index))
	);
}

function getLinesWithHeight({ from, to, height }) {
	return getLines({ from, to }).map((line) => ({
		content: line,
		height,
	}));
}

describe.each([
	[
		'no page height',
		{
			allLinesWithHeight: getLinesWithHeight({
				from: 1,
				to: 3,
				height: 20,
			}),
			options: {
				columnsCount: 2,
				normalPageHeight: 0,
			},
		},
		[[[]]],
	],
	[
		'1 page, 1 column',
		{
			allLinesWithHeight: getLinesWithHeight({
				from: 1,
				to: 3,
				height: 20,
			}),
			options: {
				columnsCount: 2,
				normalPageHeight: 100,
			},
		},
		[[getLines({ from: 1, to: 3 })]],
	],
	[
		'1 page, 2 columns',
		{
			allLinesWithHeight: getLinesWithHeight({
				from: 1,
				to: 7,
				height: 20,
			}),
			options: {
				columnsCount: 2,
				normalPageHeight: 100,
			},
		},
		[[getLines({ from: 1, to: 5 }), getLines({ from: 6, to: 7 })]],
	],
	[
		'1 page, 3 columns',
		{
			allLinesWithHeight: getLinesWithHeight({
				from: 1,
				to: 13,
				height: 20,
			}),
			options: {
				columnsCount: 3,
				normalPageHeight: 100,
			},
		},
		[
			[
				getLines({ from: 1, to: 5 }),
				getLines({ from: 6, to: 10 }),
				getLines({ from: 11, to: 13 }),
			],
		],
	],
	[
		'3 pages, 1 column',
		{
			allLinesWithHeight: getLinesWithHeight({
				from: 1,
				to: 13,
				height: 20,
			}),
			options: {
				columnsCount: 1,
				normalPageHeight: 100,
			},
		},
		[
			[getLines({ from: 1, to: 5 })],
			[getLines({ from: 6, to: 10 })],
			[getLines({ from: 11, to: 13 })],
		],
	],
	[
		'2 pages, 2 columns',
		{
			allLinesWithHeight: getLinesWithHeight({
				from: 1,
				to: 18,
				height: 20,
			}),
			options: {
				columnsCount: 2,
				normalPageHeight: 100,
			},
		},
		[
			[getLines({ from: 1, to: 5 }), getLines({ from: 6, to: 10 })],
			[getLines({ from: 11, to: 15 }), getLines({ from: 16, to: 18 })],
		],
	],
	[
		'2 pages, 3 columns',
		{
			allLinesWithHeight: getLinesWithHeight({
				from: 1,
				to: 27,
				height: 20,
			}),
			options: {
				columnsCount: 3,
				normalPageHeight: 100,
			},
		},
		[
			[
				getLines({ from: 1, to: 5 }),
				getLines({ from: 6, to: 10 }),
				getLines({ from: 11, to: 15 }),
			],
			[
				getLines({ from: 16, to: 20 }),
				getLines({ from: 21, to: 25 }),
				getLines({ from: 26, to: 27 }),
			],
		],
	],
])('mapLinesToColumns: %s', (title, input, expected) => {
	test('Should correctly map lines to columns', () => {
		const allPagesColumns = mapLinesToColumns(
			input.allLinesWithHeight,
			input.options
		);

		expect(allPagesColumns).toEqual(expected);
	});
});

describe('noEmptyLinesOnColumnStart', () => {
	const allLinesWithHeight = getLinesWithHeight({
		from: 1,
		to: 20,
		height: 20,
	});
	allLinesWithHeight[5].content =
		allLinesWithHeight[6].content =
		allLinesWithHeight[7].content =
		allLinesWithHeight[13].content =
		allLinesWithHeight[14].content =
		allLinesWithHeight[15].content =
			emptyLine;

	test('should not allow empty lines on column start with noEmptyLinesOnColumnStart = true', () => {
		const allPagesColumns = mapLinesToColumns(allLinesWithHeight, {
			columnsCount: 2,
			noEmptyLinesOnColumnStart: true,
			normalPageHeight: 100,
		});

		const expected = [
			[getLines({ from: 1, to: 5 }), getLines({ from: 9, to: 13 })],
			[getLines({ from: 17, to: 20 })],
		];

		expect(allPagesColumns).toEqual(expected);
	});

	test('edge case if blank line is "part" of a non breakable block: empty line should not disappear', () => {
		const allLinesWithHeightLocal = [
			chordLine,
			getTextLine(1),
			chordLine,
			getTextLine(2),
			chordLine,
			getTextLine(3),
			emptyLine,
			chordLine,
			getTextLine(4),
		].map((line) => ({ content: line, height: 20 }));

		const allPagesColumns = mapLinesToColumns(allLinesWithHeightLocal, {
			columnsCount: 2,
			noEmptyLinesOnColumnStart: true,
			noOrphanTextLine: true,
			normalPageHeight: 100,
		});

		const expected = [
			[
				[chordLine, getTextLine(1), chordLine, getTextLine(2)],
				[
					chordLine,
					getTextLine(3),
					emptyLine,
					chordLine,
					getTextLine(4),
				],
			],
		];

		expect(allPagesColumns).toEqual(expected);
	});

	test('should allow empty lines on column start with noEmptyLinesOnColumnStart = false', () => {
		const allPagesColumns = mapLinesToColumns(allLinesWithHeight, {
			columnsCount: 2,
			noEmptyLinesOnColumnStart: false,
			normalPageHeight: 100,
		});

		const expected = [
			[
				getLines({ from: 1, to: 5 }),
				[
					emptyLine,
					emptyLine,
					emptyLine,
					...getLines({ from: 9, to: 10 }),
				],
			],
			[
				[...getLines({ from: 11, to: 13 }), emptyLine, emptyLine],
				[emptyLine, ...getLines({ from: 17, to: 20 })],
			],
		];

		expect(allPagesColumns).toEqual(expected);
	});
});

describe('noOrphanTextLine', () => {
	const allLinesWithHeight = new Array(20)
		.fill(textLine)
		.map((_, index) => (index % 2 === 0 ? chordLine : getTextLine(index)))
		.map((line) => ({ content: line, height: 20 }));

	test('should not allow to break a chord line from its associated text line if noOrphanTextLine = true', () => {
		const allPagesColumns = mapLinesToColumns(allLinesWithHeight, {
			columnsCount: 2,
			noOrphanTextLine: true,
			normalPageHeight: 100,
		});

		const expected = [
			[
				[chordLine, getTextLine(1), chordLine, getTextLine(3)],
				[chordLine, getTextLine(5), chordLine, getTextLine(7)],
			],
			[
				[chordLine, getTextLine(9), chordLine, getTextLine(11)],
				[chordLine, getTextLine(13), chordLine, getTextLine(15)],
			],
			[[chordLine, getTextLine(17), chordLine, getTextLine(19)]],
		];

		expect(allPagesColumns).toEqual(expected);
	});
});

describe('columnBreakOnSection', () => {
	test('should not split a paragraph in the middle', () => {
		const allLinesWithHeight = [
			getTextLine(1),
			getTextLine(2),
			emptyLine,
			getTextLine(3),
			getTextLine(4),
			getTextLine(5),
			getTextLine(6),
			getTextLine(7),
			emptyLine,
			getTextLine(8),
			getTextLine(9),
		].map((line) => ({ content: line, height: 20 }));

		const allPagesColumns = mapLinesToColumns(allLinesWithHeight, {
			columnsCount: 2,
			noOrphanTextLine: true,
			columnBreakOnSection: true,
			normalPageHeight: 100,
		});

		const expected = [
			[
				[getTextLine(1), getTextLine(2), emptyLine],
				[
					getTextLine(3),
					getTextLine(4),
					getTextLine(5),
					getTextLine(6),
					getTextLine(7),
				],
			],
			[[getTextLine(8), getTextLine(9)]],
		];

		expect(allPagesColumns).toEqual(expected);
	});

	test('should just "dumb"-render lines if block is too long for a single column', () => {
		const allLinesWithHeight = [
			getTextLine(1),
			getTextLine(2),
			emptyLine,
			getTextLine(3),
			getTextLine(4),
			getTextLine(5),
			getTextLine(6),
			getTextLine(7),
			getTextLine(8),
			getTextLine(9),
			getTextLine(10),
			getTextLine(11),
			emptyLine,
			getTextLine(12),
			getTextLine(13),
			getTextLine(14),
		].map((line) => ({ content: line, height: 20 }));

		const allPagesColumns = mapLinesToColumns(allLinesWithHeight, {
			columnsCount: 3,
			noOrphanTextLine: true,
			columnBreakOnSection: true,
			normalPageHeight: 100,
		});

		const expected = [
			[
				[
					getTextLine(1),
					getTextLine(2),
					emptyLine,
					getTextLine(3),
					getTextLine(4),
				],
				[
					getTextLine(5),
					getTextLine(6),
					getTextLine(7),
					getTextLine(8),
					getTextLine(9),
				],
				[getTextLine(10), getTextLine(11), emptyLine],
			],
			[[getTextLine(12), getTextLine(13), getTextLine(14)]],
		];

		expect(allPagesColumns).toEqual(expected);
	});
});

describe('sectionLabel orphan control', () => {
	const sectionLabel =
		'<p class="cmLine"><span class="cmSectionLabel">Verse</span></p>';

	test('should not allow a section label to be the last line of a column', () => {
		// 5 lines per column at height 20 each in a 100px column.
		// Line 5 is a section label, so a break is NOT allowed after it.
		// The break happens after line 6 (the next content line) instead.
		const allLinesWithHeight = [
			...getLinesWithHeight({ from: 1, to: 4, height: 20 }),
			{ content: sectionLabel, height: 20 },
			{ content: getTextLine(6), height: 20 },
			{ content: getTextLine(7), height: 20 },
		];

		const allPagesColumns = mapLinesToColumns(allLinesWithHeight, {
			columnsCount: 2,
			noOrphanTextLine: false,
			columnBreakOnSection: false,
			normalPageHeight: 100,
		});

		// The section label must appear together with the text line that follows it.
		// Column 1 should contain lines 1-4 (80px), not end with the label.
		// Column 2 should start with the section label + its content.
		const col1 = allPagesColumns[0][0];
		const col2 = allPagesColumns[0][1];

		expect(col1[col1.length - 1]).not.toBe(sectionLabel);
		expect(col2[0]).toBe(sectionLabel);
	});

	test('section label at the very end of content is still rendered (no nextLine)', () => {
		const allLinesWithHeight = [
			...getLinesWithHeight({ from: 1, to: 3, height: 20 }),
			{ content: sectionLabel, height: 20 },
		];

		const allPagesColumns = mapLinesToColumns(allLinesWithHeight, {
			columnsCount: 1,
			noOrphanTextLine: false,
			columnBreakOnSection: false,
			normalPageHeight: 100,
		});

		// All 4 lines should appear on the single column/page
		expect(allPagesColumns[0][0].length).toBe(4);
		expect(allPagesColumns[0][0][3]).toBe(sectionLabel);
	});
});

describe('firstPageHeight', () => {
	test('allows a different column height for the first page', () => {
		const allLinesWithHeight = getLinesWithHeight({
			from: 1,
			to: 20,
			height: 20,
		});

		const allPagesColumns = mapLinesToColumns(allLinesWithHeight, {
			columnsCount: 3,
			noOrphanTextLine: true,
			columnBreakOnSection: true,
			firstPageHeight: 50,
			normalPageHeight: 100,
		});

		const expected = [
			[
				getLines({ from: 1, to: 2 }),
				getLines({ from: 3, to: 4 }),
				getLines({ from: 5, to: 6 }),
			],
			[
				getLines({ from: 7, to: 11 }),
				getLines({ from: 12, to: 16 }),
				getLines({ from: 17, to: 20 }),
			],
		];

		expect(allPagesColumns).toEqual(expected);
	});
});
