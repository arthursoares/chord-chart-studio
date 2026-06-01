import React from 'react';
import PropTypes from 'prop-types';

function PageHeader(props) {
	const { title, composer, songKey } = props;

	return (
		<div className={'printPreview-pageHeader'}>
			<div className={'printPreview-pageTitle'}>{title}</div>
			{composer ? (
				<div className={'printPreview-pageComposer'}>{composer}</div>
			) : null}
			{songKey ? (
				<div className={'printPreview-pageKey'}>
					{'Key: ' + songKey}
				</div>
			) : null}
		</div>
	);
}
PageHeader.defaultProps = {
	composer: '',
	songKey: '',
};
PageHeader.propTypes = {
	title: PropTypes.string.isRequired,
	composer: PropTypes.string,
	songKey: PropTypes.string,
};

export default React.memo(PageHeader);
