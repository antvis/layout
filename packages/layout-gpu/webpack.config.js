const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  output: {
    filename: "index.min.js",
    path: path.resolve(__dirname, "dist"),
    library: "LayoutGPU",
    libraryTarget: "umd",
    clean: true,
  },
  externals: {
    "@antv/layout": {
      commonjs: "@antv/layout@alpha",
      commonjs2: "@antv/layout@alpha",
      amd: "@antv/layout@alpha",
      root: "Layout", // indicates global variable
    },
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
