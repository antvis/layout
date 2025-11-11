import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './__tests__',
  server: {
    port: 8080,
    open: '/',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@@': path.resolve(__dirname, './__tests__'),
    },
  },
});
