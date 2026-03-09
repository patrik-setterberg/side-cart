const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

// Custom config for Interactivity API module (can't use defaultConfig externals).
const interactivityConfig = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
        'frontend/view': './src/frontend/view.js',
        'frontend/structure': './src/frontend/structure.js',
    },
    output: {
        path: path.resolve( __dirname, 'build' ),
        filename: '[name].js',
        module: true,
        chunkFormat: 'module',
        library: { type: 'module' },
    },
    experiments: { outputModule: true },
    externalsType: 'module',
    externals: {
        '@wordpress/interactivity': '@wordpress/interactivity',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [ '@wordpress/babel-preset-default' ],
                    },
                },
            },
            {
                test: /\.css$/,
                use: [
                    require( 'mini-css-extract-plugin' ).loader,
                    'css-loader',
                    'postcss-loader',
                ],
            },
        ],
    },
    plugins: [
        new ( require( 'mini-css-extract-plugin' ) )( {
            filename: '[name].css',
        } ),
    ],
};

module.exports = [
    interactivityConfig,

    // Admin — standard script for the React settings page.
    {
        ...defaultConfig,
        entry: { 'admin/index': './src/admin/index.js' },
        output: {
            path: path.resolve( __dirname, 'build' ),
        },
    },

    // Block — cart trigger block editor script.
    {
        ...defaultConfig,
        entry: { 'blocks/cart-trigger/index': './blocks/cart-trigger/index.js' },
        output: {
            path: path.resolve( __dirname, 'build' ),
        },
        plugins: [
            ...defaultConfig.plugins,
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: './blocks/cart-trigger/block.json',
                        to: 'blocks/cart-trigger/block.json',
                    },
                ],
            }),
        ],
    },
];