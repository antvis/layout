const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  output: {
    filename: "index.min.js",
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
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  devtool: "source-map",
};
