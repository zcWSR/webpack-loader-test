const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * @type {import('webpack').Configuration}
 */
const config = {
  entry: './index.js',
  resolveLoader: {
    alias: {
      docs: path.resolve(__dirname, 'loaders/docLoader.js')
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.bundle.js'
  },
  plugins: [new HtmlWebpackPlugin(), new webpack.HotModuleReplacementPlugin()]
}

module.exports = config