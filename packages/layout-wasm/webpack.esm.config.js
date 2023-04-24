const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  experiments: {
    outputModule: true,
  },
  output: {
    library: {
      type: "module",
    },
    path: path.resolve(__dirname, "esm"),
    filename: "index.esm.js",
    clean: true,
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
