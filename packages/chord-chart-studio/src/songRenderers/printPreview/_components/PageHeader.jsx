import React from 'react';
import PropTypes from 'prop-types';

function PageHeader(props) {
	const { title, composer } = props;

	return (
		<div className={'printPreview-pageHeader'}>
			<div className={'printPreview-pageTitle'}>{title}</div>
			{composer ? (
				<div className={'printPreview-pageComposer'}>{composer}</div>
			) : null}
		</div>
	);
}
PageHeader.defaultProps = {
	composer: '',
};
PageHeader.propTypes = {
	title: PropTypes.string.isRequired,
	composer: PropTypes.string,
};

export default React.memo(PageHeader);
