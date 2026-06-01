/* eslint-env node */
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		rollupOptions: {
			external: ['electron'],
		},
	},
});
