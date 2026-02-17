const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = [
	// Frontend — script module for the Interactivity API.
	{
		...defaultConfig,
		entry: { 'frontend/view': './src/frontend/view.js' },
		output: {
			path: path.resolve( __dirname, 'build' ),
			module: true,
			chunkFormat: 'module',
			library: { type: 'module' },
		},
		experiments: { outputModule: true },
	},

	// Admin — standard script for the React settings page.
	{
		...defaultConfig,
		entry: { 'admin/index': './src/admin/index.js' },
		output: {
			path: path.resolve( __dirname, 'build' ),
		},
	},
];
