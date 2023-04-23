import { defineConfig } from "vite";

export default defineConfig({
  root: "./demo/",
  server: {
    port: 8080,
    open: "/",
  },
  publicDir: "../dist",
  base: "/layout/",
});
