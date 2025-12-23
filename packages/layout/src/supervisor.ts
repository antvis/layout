import { Remote, wrap } from 'comlink';
import type { GraphData, LayoutData, PlainObject } from './types';
import type { LayoutWorker } from './worker';

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
  ): Promise<LayoutData> {
    if (!this.worker) {
      await this.initWorker();
    }

    if (!this.workerApi) {
      throw new Error('Worker API not initialized');
    }

    const result = await this.workerApi.execute(layoutId, data, options);
    return result;
  }

  /**
   * Stop layout calculation
   */
  stop(): void {
    this.workerApi?.stop();
  }

  /**
   * Execute iteration
   */
  async tick(iterations?: number): Promise<LayoutData> {
    if (!this.workerApi) {
      throw new Error('Worker API not initialized');
    }

    return this.workerApi.tick(iterations);
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
