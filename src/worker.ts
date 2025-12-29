import { expose } from 'comlink';
import { registry } from './registry';
import type { Graph, GraphData, PlainObject } from './types';

let layoutInstance: any = null;

export interface LayoutWorker {
  execute(
    id: string,
    data: GraphData,
    config: PlainObject,
  ): Promise<Graph>;
  destroy(): void;
}

const api: LayoutWorker = {
  async execute(id: string, data: GraphData, options: Record<string, any>) {
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
  cloned.enableWorker = false;
  return cloned;
}
