const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 9000,
    open: true,
    devMiddleware: {
      writeToDisk: true,
    },
    client: {
      overlay: {
        errors: true,
        warnings: false, // Hide warnings to avoid the InjectManifest warning
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/scripts/sw.js'),
      swDest: 'sw.bundle.js',
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    }),
  ],
});



