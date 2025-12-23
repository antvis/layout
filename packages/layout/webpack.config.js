const path = require("path");

const baseConfig = {
  resolve: {
    // Add `.ts` as a resolvable extension.
    extensions: [".ts", ".js"],
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
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
            configFile: path.resolve(__dirname, 'tsconfig.build.json'),
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.worker\.ts$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },
  devtool: "source-map",
};

const mainConfig = {
  entry: "./src/exports.ts",
  output: {
    filename: "index.min.js",
    publicPath: "",
    path: path.resolve(__dirname, "dist"),
    library: "Layout",
    libraryTarget: "umd",
    clean: true,
    globalObject: "this",
  },
};

const workerConfig = {
  target: "webworker",
  entry: "./src/worker.ts",
  output: {
    filename: "worker.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/",
    clean: false,
  },
};

module.exports = [
  Object.assign({}, baseConfig, mainConfig),
  Object.assign({}, baseConfig, workerConfig),
];
