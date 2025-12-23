import { expose } from 'comlink';
import { isLayoutWithIterations } from './core/base-layout';
import { registry } from './registry';
import type { GraphData, LayoutData, PlainObject } from './types';

let layoutInstance: any = null;

export interface LayoutWorker {
  execute(
    id: string,
    data: GraphData,
    config: PlainObject,
  ): Promise<LayoutData>;
  stop(): void;
  tick(iterations?: number): LayoutData;
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

  stop() {
    if (layoutInstance && isLayoutWithIterations(layoutInstance)) {
      layoutInstance.stop();
    }
  },

  tick(iterations?: number): LayoutData {
    if (layoutInstance && isLayoutWithIterations(layoutInstance)) {
      layoutInstance.tick(iterations);

      return (layoutInstance as any).model.data();
    }
    return {} as LayoutData;
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
