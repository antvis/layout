export default {
  cjs: "rollup",
  esm: "rollup",
  umd: false,
  nodeResolveOpts: {
    mainFields: ["module", "browser", "main"],
  },
  pkgs: ["layout"],
};
