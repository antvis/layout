const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

module.exports = {
  entry: {
    layout: ['@babel/polyfill', './src/index.ts'],
  },
  output: {
    filename: '[name].min.js',
    library: '[name]',
    libraryTarget: 'umd',
    path: resolveApp('dist/'),
  },
  resolve: {
    mainFields: ['module', 'main'],
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    ...(process.env.MODE === 'ANALYZER'
      ? [new BundleAnalyzerPlugin({ analyzerMode: 'static' })]
      : []),
  ],
  performance: {
    hints: false,
  },
  devtool: 'source-map',
};
