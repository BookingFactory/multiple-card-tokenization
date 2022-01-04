var webpack = require('webpack');

module.exports = {
  entry: './src/index',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'stage-1']
        }
      }
    ]
  },
  output: {
    filename: 'dist_staging/multipleCardTokenizationStaging.min.js',
    libraryTarget: 'umd',
    library: 'multipleCardTokenization'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
        'ENV_DOMAIN': JSON.stringify('https://app.test.thebookingfactory.com')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  ]
};