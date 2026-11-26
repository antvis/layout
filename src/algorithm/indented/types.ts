import type { ID } from '../../types';
import type { BaseLayoutOptions } from '../types';

export interface IndentedLayoutOptions extends BaseLayoutOptions {
  /** Horizontal offset per tree level. Defaults to 80. */
  indent?: number;
  /** Vertical separation between consecutive rows. Defaults to 40. */
  rowHeight?: number;
  /** Direction of indentation. Defaults to LR. */
  direction?: 'LR' | 'RL';
  /** Tree root. Defaults to the first node with no parent, in input order. */
  rootId?: ID;
}
