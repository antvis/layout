import typescript from "@rollup/plugin-typescript";
import rust from "@wasm-tool/rollup-plugin-rust";

export default {
  input: "index.ts",
  output: {
    file: "dist/index.umd.js",
    format: "umd",
    sourcemap: true,
    name: "layout",
  },
  plugins: [rust(), typescript()],
};
