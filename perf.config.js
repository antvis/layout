import { defineConfig } from 'iperf';
import path from 'path';

export default defineConfig({
  perf: {
    socket: {
      port: 7880,
      timeout: 300 * 1000, // 5 minutes timeout for large graph layouts
    },
    report: {
      dir: 'perf/reports',
    },
  },
  resolve: {
    alias: {
      '@antv/layout': path.resolve(__dirname, './packages/layout/src'),
    },
  },
});
