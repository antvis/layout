const path = require("path");

module.exports = {
  entry: "./src/bundle-entry.ts",
  output: {
    filename: "index.min.js",
    publicPath: "",
    path: path.resolve(__dirname, "dist"),
    library: "Layout",
    libraryTarget: "umd",
    clean: true,
    globalObject: "this",
  },
  resolve: {
    // Add `.ts` as a resolvable extension.
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // 禁用类型检查
            experimentalWatchApi: true,
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  devtool: "source-map",
};
