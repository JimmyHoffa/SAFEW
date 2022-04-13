const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = [{
    entry: [
        'react-hot-loader/patch',
        'regenerator-runtime/runtime.js',
        './src/index.js'
    ],
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": [
                            "@babel/preset-env",
                           ["@babel/preset-react", {"runtime": "automatic"}]
                        ]
                    }
                },
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.svg$/,
                use: 'file-loader'
            },
            {
                test: /\.png$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            mimetype: 'image/png'
                        }
                    }
                ]
            }
        ]
    },
    devServer: {
        'static': {
            directory: './build'
        }
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: 'public' }],
        }),
        new HtmlWebpackPlugin({
            template: 'public/index_template.html',
            inject: true,
            filename: 'index.html',
        }),
        // new webpack.ContextReplacementPlugin(
        //     /ergo-lib-wasm-browser/,
        //     (data) => {
        //         delete data.dependencies[0].critical;
        //         return data;
        //     },
        // ),
        // Work around for Buffer is undefined:
        // https://github.com/webpack/changelog-v5/issues/10
        // Necessary for some buffer calls done throughout
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        })
    ],
    resolve: {
        fallback: { "stream": require.resolve("stream-browserify") }
    },
    experiments: {
        asyncWebAssembly: true
        // syncWebAssembly: true
    },
    externals: {
      'ergo-lib-browser.asm': 'ergolibbrowser'
    },
    mode: 'development'
},
{
    entry: [
        path.resolve(__dirname, 'background', 'background.js')
    ],
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: path.join('background.js')
    },
    experiments: {
        outputModule: true,
    },
    module: {

        rules: [
            {
                test: /background.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ["@babel/preset-env"],
                        plugins: [
                            '@babel/plugin-transform-runtime',
                            '@babel/plugin-transform-regenerator',
                            '@babel/plugin-transform-modules-commonjs'
                        ]
                    }
                }
            }
        ]
    }
},
];

module.exports = config;


// webpack@latest webpack-cli@latest @babel/preset-react@latest babel-loader@latest @babel/core@latest @babel/preset-env@latest @hot-loader/react-dom@latest webpack-dev-server@latest file-loader@latest css-loader@latest style-loader@latest url-loader@latest html-webpack-plugin@latest copy-webpack-plugin@latest react-hot-loader@latest
