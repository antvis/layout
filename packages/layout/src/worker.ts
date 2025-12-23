import { expose } from 'comlink';
import { isLayoutWithIterations } from './core/base-layout';
import { registry } from './registry';
import type { GraphData, LayoutData } from './types';

let layoutInstance: any = null;

const api = {
  async execute(
    id: string,
    data: GraphData,
    options: Record<string, any>,
  ): Promise<LayoutData> {
    const LayoutCtor = registry[id];

    if (!LayoutCtor) {
      throw new Error(`Layout "${id}" is not registered.`);
    }

    layoutInstance?.destroy?.();

    layoutInstance = new LayoutCtor();

    const opts = disableWorker(options);
    await layoutInstance.execute(data, opts);

    return layoutInstance.model.data();
  },

  stop() {
    if (layoutInstance && isLayoutWithIterations(layoutInstance)) {
      layoutInstance.stop();
    }
  },

  tick(iterations?: number) {
    if (layoutInstance && isLayoutWithIterations(layoutInstance)) {
      layoutInstance.tick(iterations);
    }
  },

  destroy() {
    layoutInstance?.destroy?.();
    layoutInstance = null;
    if (typeof self !== 'undefined' && 'close' in self) {
      (self as any).close();
    }
  },
};

expose(api);

function disableWorker(options?: Record<string, any>) {
  if (!options) return options;
  const cloned = { ...options };
  cloned.workerEnabled = false;
  return cloned;
}
