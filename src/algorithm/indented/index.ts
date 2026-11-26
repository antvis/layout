import type { ID } from '../../types';
import { BaseLayout } from '../base-layout';
import type { IndentedLayoutOptions } from './types';

export type { IndentedLayoutOptions };

/**
 * <zh/> 缩进树布局
 *
 * <en/> Lay out a directed tree in depth-first order, with one node per row.
 */
export class IndentedLayout extends BaseLayout<IndentedLayoutOptions> {
  id = 'indented';

  protected getDefaultOptions(): IndentedLayoutOptions {
    return { indent: 80, rowHeight: 40, direction: 'LR' };
  }

  protected async layout(options: IndentedLayoutOptions): Promise<void> {
    const { indent = 80, rowHeight = 40, direction = 'LR' } = options;
    const nodes = this.model.nodes();
    const rootId =
      options.rootId ??
      nodes.find((node) => this.model.predecessors(node.id).length === 0)?.id ??
      nodes[0]?.id;

    for (const node of nodes) {
      node.x = 0;
      node.y = 0;
    }
    if (rootId === undefined) return;

    const visited = new Set<ID>();
    const stack = [{ id: rootId, depth: 0 }];
    const horizontalStep = direction === 'RL' ? -indent : indent;
    let row = 0;

    while (stack.length > 0) {
      const { id, depth } = stack.pop()!;
      const node = this.model.node(id);
      if (!node || visited.has(id)) continue;
      visited.add(id);

      node.x = depth === 0 ? 0 : depth * horizontalStep;
      node.y = row * rowHeight;
      node.depth = depth;
      row++;

      const children = this.model.successors(id);
      for (let index = children.length - 1; index >= 0; index--) {
        stack.push({ id: children[index], depth: depth + 1 });
      }
    }
  }
}
