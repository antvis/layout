import type { Point } from '../types';
import type { GraphLib } from '../model/data';

/**
 * Return the layout result for a graph with zero or one node.
 * @param graph original graph
 * @param center the layout center
 * @returns layout result
 */
export function applySingleNodeLayout(
  model: GraphLib,
  center: Point,
  dimensions: 2 | 3 = 2,
) {
  const n = model.nodeCount();

  if (n === 1) {
    const first = model.firstNode()!;
    first.x = center[0];
    first.y = center[1];
    if (dimensions === 3) {
      first.z = center[2] || 0;
    }
  }
}
