const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

const dist = path.resolve(__dirname, "dist");

module.exports = {
  mode: "production",
	entry: "./src/main.ts",
  output: {
    path: dist,
    filename: "index.js",
  },
  devServer: {
    port: 8001,
    hot: true,
    static: {
      directory: dist,
    },
    open: true,
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [path.resolve(__dirname, "static")],
    }),
  ],
};
