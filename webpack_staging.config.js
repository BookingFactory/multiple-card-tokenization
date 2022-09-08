var webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/index',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader' }
        ]
      }
    ]
  },
  output: {
    filename: 'staging/multipleCardTokenizationStaging.min.js',
    libraryTarget: 'umd',
    library: 'multipleCardTokenization'
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
        'ENV_DOMAIN': JSON.stringify('https://app.test.thebookingfactory.com')
      }
    })
  ]
};
