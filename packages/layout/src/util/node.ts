import type { Node } from '../types';
import type { Size } from '../util/size';

/**
 * Get the maximum size of nodes
 */
export function getMaxNodeSize<T extends Node>(
  nodes: T[],
  nodeSize: (node: T) => Size,
): number {
  let maxNodeSize = -Infinity;
  nodes.forEach((node) => {
    const nSize = nodeSize(node);
    const size = Array.isArray(nSize) ? Math.max(...nSize) : nSize;
    if (maxNodeSize < size) maxNodeSize = size;
  });
  return maxNodeSize;
}
