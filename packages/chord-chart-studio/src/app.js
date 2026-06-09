import '../css/global.css';
import '../scss/styles.scss';

import { createStore } from './state/store';
import registerHandlers from './registerHandlers';
import registerDesktopHandlers from './desktop/registerDesktopHandlers';
import addSampleContent from './addSampleContent';
import router, { navigateTo } from './core/router';
import allRoutes from './modules/allRoutes';

registerHandlers();

export default function run() {
	createStore();

	registerDesktopHandlers();

	addSampleContent();

	const currentPathname = window
		? window.location.pathname + window.location.search
		: '/';

	router.init(allRoutes);

	return navigateTo(currentPathname);
}
