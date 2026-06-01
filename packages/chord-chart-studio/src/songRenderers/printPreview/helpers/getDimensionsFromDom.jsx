import './getDimensionsFromDom.scss';

import React, { useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';

export default function getDimensionsFromDom(component, measuringFn) {
	const container = document.createElement('div');
	// The print-preview styles — including chord-diagram sizing
	// (`.printPreview .cmChordDiagram`) — are scoped under these classes.
	// The measuring node must carry them too, otherwise the dictionary's
	// diagrams collapse to ~0 height and `firstPageHeight` is overestimated,
	// overstuffing the first page. See PrintPreview.jsx for the live wrapper.
	container.classList.add('measuring-node', 'printPreview', 'cmTheme-print');
	document.body.appendChild(container);
	const root = createRoot(container);

	return new Promise((resolve) => {
		const MeasuringComponent = () => {
			useLayoutEffect(() => {
				const measure = measuringFn(container);
				resolve(measure);
			});

			return <div>{component}</div>;
		};

		root.render(<MeasuringComponent />);
	}).then((measure) => {
		root.unmount();
		container.parentNode.removeChild(container);

		return measure;
	});
}
