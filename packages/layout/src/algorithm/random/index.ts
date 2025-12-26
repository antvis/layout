import { normalizeViewport } from '../../util';
import { BaseLayout } from '../base-layout';
import type { RandomLayoutOptions } from './types';

export type { RandomLayoutOptions };

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

    this.model.forEachNode((node) => {
      node.x = randomCoord(width) + center[0];
      node.y = randomCoord(height) + center[1];
    });
  }
}

const layoutScale = 0.9;

/**
 * <zh/> 生成随机坐标
 *
 * <en/> Generate random coordinates
 */
const randomCoord = (size: number) =>
  (Math.random() - 0.5) * layoutScale * size;
