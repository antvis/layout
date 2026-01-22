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
    const scriptUrl = (() => {
      if (typeof document === 'undefined') return null;

      const currentScript = document.currentScript as HTMLScriptElement | null;
      if (currentScript?.src) return currentScript.src;

      const scripts = document.getElementsByTagName('script');

      for (let i = scripts.length - 1; i >= 0; i--) {
        const src = scripts[i].src;
        if (!src) continue;
        if (src.includes('index.js') || src.includes('index.min.js')) {
          return src;
        }
      }

      return null;
    })();

    if (scriptUrl) {
      if (scriptUrl.includes('index.js') || scriptUrl.includes('index.min.js')) {
        const asIndex = scriptUrl.replace(/index(\.min)?\.(m?js)(\?.*)?$/, 'worker.js');
        if (asIndex !== scriptUrl) return asIndex;
      }

      // e.g. `.../lib/runtime/supervisor.js` -> `.../lib/worker.js`
      const asRoot = scriptUrl.replace(/\/runtime\/[^/]+\.(m?js)(\?.*)?$/, '/worker.js');
      if (asRoot !== scriptUrl) return asRoot;

      // Fallback: keep legacy behavior (same directory)
      const asSibling = scriptUrl.replace(/\/[^/]+\.(m?js)(\?.*)?$/, '/worker.js');
      if (asSibling !== scriptUrl) return asSibling;
    }

    return './worker.js';
  }
}
