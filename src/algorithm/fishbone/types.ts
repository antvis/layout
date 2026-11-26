import type { NodeData } from '../../types';
import type { BaseLayoutOptions } from '../types';

export interface FishboneLayoutOptions extends BaseLayoutOptions {
  /** Direction of the spine. Defaults to LR, with the head at the right. */
  direction?: 'LR' | 'RL';
  /** Distance between category attachment points on the spine. Defaults to 180. */
  categoryGap?: number;
  /** Horizontal offset between an item and its category rib. Defaults to 20. */
  itemHStep?: number;
  /** Vertical distance from a category to the spine. Defaults to 200. */
  categoryDistance?: number;
  /** Width of the input node. Defaults to 80. */
  getWidth?: (node: NodeData) => number;
}
