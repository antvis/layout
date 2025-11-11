import { Canvas, CanvasConfig, resetEntityCounter } from '@antv/g';
import { Renderer as SVGRenderer } from '@antv/g-svg';
import { OffscreenCanvasContext } from './offscreen-canvas-context';

/**
 * Create graph canvas with config.
 * @param dom - dom
 * @param width - width
 * @param height - height
 * @param options - options
 * @returns instance
 */
export function createGraphCanvas(
  dom?: null | HTMLElement,
  width: number = 500,
  height: number = 500,
  options?: Partial<CanvasConfig>,
) {
  const container = dom || document.createElement('div');

  resetEntityCounter();

  const extraOptions: Record<string, unknown> = {
    ...options,
  };

  if (globalThis.process) {
    const offscreenNodeCanvas = {
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const context = new OffscreenCanvasContext(offscreenNodeCanvas);
    // 下列参数仅在 node 环境下需要传入 / These parameters only need to be passed in the node environment
    Object.assign(extraOptions, {
      document: container.ownerDocument,
      offscreenCanvas: offscreenNodeCanvas,
    });
  }

  const offscreenNodeCanvas = {
    getContext: () => context,
  } as unknown as HTMLCanvasElement;
  const context = new OffscreenCanvasContext(offscreenNodeCanvas);

  return new Canvas({
    container,
    width,
    height,
    renderer: new SVGRenderer(),
    ...extraOptions,
  });
}
