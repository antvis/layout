import { Remote, wrap } from 'comlink';
import type { Graph, GraphData, PlainObject } from '../types';
import type { LayoutWorker } from '../worker';

export class Supervisor {
  private worker: Worker | null = null;
  private workerApi: Remote<LayoutWorker> | null = null;

  /**
   * Execute layout in worker
   */
  async execute(
    layoutId: string,
    data: GraphData,
    options: PlainObject,
  ): Promise<Graph> {
    if (!this.worker) {
      await this.initWorker();
    }

    if (!this.workerApi) {
      throw new Error('Worker API not initialized');
    }

    return await this.workerApi.execute(layoutId, data, options);
  }

  /**
   * Destroy worker
   */
  destroy(): void {
    if (this.workerApi) {
      this.workerApi.destroy();
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerApi = null;
    }
  }

  /**
   * Initialize worker
   */
  private async initWorker(): Promise<void> {
    const workerPath = this.resolveWorkerPath();

    const isESM = workerPath.includes('/lib/') || workerPath.endsWith('.mjs');
    const type = isESM ? 'module' : 'classic';

    this.worker = new Worker(workerPath, { type });
    this.workerApi = wrap<LayoutWorker>(this.worker);
  }

  /**
   * Resolve worker script path which works in both ESM and UMD environments
   */
  private resolveWorkerPath(): string {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      const currentUrl = new URL(import.meta.url);
      // e.g. `.../lib/runtime/supervisor.js` -> `.../lib/worker.js`
      const asRoot = currentUrl.href.replace(/\/runtime\/[^/]+\.js$/, '/worker.js');
      if (asRoot !== currentUrl.href) return asRoot;
      // Fallback: keep legacy behavior (same directory)
      return currentUrl.href.replace(/\/[^/]+\.js$/, '/worker.js');
    }

    if (typeof document !== 'undefined') {
      const scripts = document.getElementsByTagName('script');
      for (let i = scripts.length - 1; i >= 0; i--) {
        const src = scripts[i].src;
        if (src && (src.includes('index.js') || src.includes('index.min.js'))) {
          return src.replace(/index(\.min)?\.js/, 'worker.js');
        }
      }
    }

    return './worker.js';
  }
}
