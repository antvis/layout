import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@antv/layout': path.resolve(__dirname, '../src'),
    },
  },
  server: {
    open: '/esm.html',
    port: 4173,
  },
});
