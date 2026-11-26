import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@@': path.resolve(__dirname, './__tests__'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.{test,spec}.{ts,tsx,js}'],
    exclude: ['node_modules/**', 'dist/**', 'lib/**', 'esm/**'],
    testTimeout: 100000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'json', 'lcov', 'clover'],
    },
  },
});
