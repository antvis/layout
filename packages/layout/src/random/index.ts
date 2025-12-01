import { BaseLayout } from '../base-layout';
import { normalizeViewport } from '../util';
import type { RandomLayoutOptions } from './types';

/**
 * <zh/> 随机布局
 *
 * <en/> Random layout
 */
export class RandomLayout extends BaseLayout<RandomLayoutOptions> {
  id = 'random';

  protected getDefaultOptions(): Partial<RandomLayoutOptions> {
    return {
      center: [0, 0],
      width: 300,
      height: 300,
    };
  }

  protected async layout(): Promise<void> {
    const { width, height, center } = normalizeViewport(this.options);
    const layoutScale = 0.9;

    const randomCoord = (size: number) =>
      (Math.random() - 0.5) * layoutScale * size;

    this.model.nodes().forEach((node) => {
      node.x = randomCoord(width) + center[0];
      node.y = randomCoord(height) + center[1];
    });
  }
}
