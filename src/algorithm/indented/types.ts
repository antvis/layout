import type { BaseLayoutOptions } from '../types';

export interface IndentedLayoutOptions extends BaseLayoutOptions {
  /** Horizontal offset per depth. Defaults to 80. */
  indent?: number;
  /** Vertical gap between DFS rows. Defaults to 40. */
  rowHeight?: number;
  /** Layout direction. Defaults to 'LR'. */
  direction?: 'LR' | 'RL';
  /** Explicit root node id. */
  rootId?: string;
  /** Palette written to data._nodeColor by depth. */
  nodeColors?: string[];
  /** Palette written to data._edgeColor by depth. */
  edgeColors?: string[];
}
