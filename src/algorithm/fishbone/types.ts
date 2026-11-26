import type { BaseLayoutOptions } from '../types';
import type { GraphNode } from '../../types';

export interface FishboneLayoutOptions extends BaseLayoutOptions {
  /** Layout direction. Defaults to 'LR'. */
  direction?: 'LR' | 'RL';
  /** Gap between categories along the spine. Defaults to 180. */
  categoryGap?: number;
  /** Declared for compatibility; currently not used by the layout. */
  itemGap?: number;
  /** Extra horizontal offset for items. Defaults to 20. */
  itemHStep?: number;
  /** Distance between category and spine. Defaults to 200. */
  categoryDistance?: number;
  /** Node width callback. Defaults to 80. */
  getWidth?: (node: GraphNode) => number;
  /** Node height callback. Defaults to 30. */
  getHeight?: (node: GraphNode) => number;
}
