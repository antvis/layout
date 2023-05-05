import { defineConfig } from "vite";

export default defineConfig({
  root: "./site/",
  server: {
    port: 8080,
    open: "/",
  },
  publicDir: "../packages/layout-wasm/dist",
  base: "/layout/",
  plugins: [
    {
      name: "isolation",
      configureServer(server) {
        // The multithreads version of @antv/layout-wasm needs to use SharedArrayBuffer, which should be used in a secure context.
        // @see https://gist.github.com/mizchi/afcc5cf233c9e6943720fde4b4579a2b
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          next();
        });
      },
    },
  ],
});
