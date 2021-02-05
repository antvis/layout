export default {
  entry: ["src/index.ts", "src/layout/worker"],
  overridesByEntry: {
    "src/layout/worker": {
      file: "index.worker"
    }
  },
  esm: "rollup",
  cjs: "rollup"
};

// umd: {
//   name: 'AntVLayout',
//   file: 'layout',
//   sourcemap: true,
// },
