import type { NodeData } from '../../types';
import type { BaseLayoutOptions } from '../types';

export interface MindmapLayoutOptions extends BaseLayoutOptions {
  /** Direction of the branches at the root. Defaults to H. */
  direction?: 'H' | 'LR' | 'RL';
  /** Horizontal distance between the bounds of neighboring levels. Defaults to 120. */
  levelGap?: number;
  /** Vertical distance between sibling nodes on the same side. Defaults to 30. */
  nodeGap?: number;
  /** Width of the input node. Defaults to 100. */
  getWidth?: (node: NodeData) => number;
  /** Height of the input node. Defaults to 40. */
  getHeight?: (node: NodeData) => number;
  /** Select the side of a child using its index and the side passed down by the parent branch. */
  getSide?: (
    node: NodeData,
    index: number,
    parentSide?: 'left' | 'right',
  ) => 'left' | 'right';
}
