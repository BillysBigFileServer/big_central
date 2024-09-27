const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production', // Change to 'production' for production builds
  entry: {
    app: './js/app.ts' // Your main JavaScript entry point
  },
  experiments: {
    asyncWebAssembly: true
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, '../priv/static/assets'), // Output to Phoenix static folder
  },
  devtool: 'source-map', // Enables source maps for easier debugging
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Transpile modern JS to support older browsers
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader', // Add this line
          'sass-loader'
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: '../images/[name][ext]'
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(), // Cleans output directory before each build
    new MiniCssExtractPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.css', '.scss', '.ts']
  }
};
