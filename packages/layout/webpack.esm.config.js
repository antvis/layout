const path = require("path");

module.exports = {
  entry: "./src/bundle-entry.ts",
  experiments: {
    outputModule: true,
  },
  output: {
    filename: "index.js",
    publicPath: "",
    path: path.resolve(__dirname, "lib"),
    library: {
      type: "module",
    },
    clean: true,
  },
  resolve: {
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
