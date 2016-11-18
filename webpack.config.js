const combineLoaders    = require('webpack-combine-loaders');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    context: __dirname + '/src',
    entry: './app.jsx',
    output: {
        path: __dirname + '/ui',
        filename: 'bundle.js'
    },

    watch: true,

    module: {
        loaders: [{
            test: /\.jsx?/,
            loader: 'babel-loader'
        }, {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract(
                'style-loader',
                combineLoaders([
                    {
                        loader: 'css-loader',
                        query: {
                            modules: true,
                            localIdentName: '[name]__[local]___[hash:base64:5]'
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ])
            )
        },
        {test: /\.svg$/, loader: 'svg-loader'}
        ]
    },
    plugins: [
        new ExtractTextPlugin('styles.css')
    ]
};
