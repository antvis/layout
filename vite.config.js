import { defineConfig } from "vite";

export default defineConfig({
  root: "./site/",
  server: {
    port: 8080,
    open: "/",
  },
  publicDir: "../packages/layout-wasm/dist",
  base: "/layout/",
});
