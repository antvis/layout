import type { BaseLayoutOptions } from '../types';
import type { GraphNode } from '../../types';

export interface MindmapLayoutOptions extends BaseLayoutOptions {
  /** Branch direction. Defaults to 'H'. */
  direction?: 'H' | 'LR' | 'RL';
  /** Horizontal gap between parent and child boundaries. Defaults to 120. */
  levelGap?: number;
  /** Vertical gap between adjacent children. Defaults to 30. */
  nodeGap?: number;
  /** Palette written to data._branchColor. */
  branchColors?: string[];
  /** Node width callback. Defaults to 100. */
  getWidth?: (node: GraphNode) => number;
  /** Node height callback. Defaults to 40. */
  getHeight?: (node: GraphNode) => number;
  /** Side assignment callback for 'H' direction. */
  getSide?: (node: GraphNode, index: number, parentSide?: 'left' | 'right') => 'left' | 'right';
}
