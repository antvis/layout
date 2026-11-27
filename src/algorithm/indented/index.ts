import { BaseLayout } from '../base-layout';
import type { IndentedLayoutOptions } from './types';

export type { IndentedLayoutOptions };

const DEFAULT_PALETTE = [
  '#1783FF',
  '#00C9C9',
  '#F08F56',
  '#D580FF',
  '#7863FF',
  '#DB9D0D',
  '#60C42D',
  '#FF80CA',
  '#2491B3',
  '#17C76F',
];

/**
 * <zh/> 缩进树布局：x 由深度决定，y 由 DFS 遍历顺序决定。
 *
 * <en/> Indented tree layout: x is determined by depth, y by DFS order.
 */
export class IndentedLayout extends BaseLayout<IndentedLayoutOptions> {
  id = 'indented';

  protected getDefaultOptions(): Partial<IndentedLayoutOptions> {
    return {
      indent: 80,
      rowHeight: 40,
      direction: 'LR',
    };
  }

  protected async layout(): Promise<void> {
    const { indent = 80, rowHeight = 40, direction = 'LR', rootId, nodeColors, edgeColors } =
      this.options;
    const children = new Map<string, string[]>();
    const hasParent = new Set<string>();
    const nodeIds = new Set<string>();

    this.model.forEachNode((node) => nodeIds.add(String(node.id)));
    this.model.forEachEdge((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);
      if (!nodeIds.has(source) || !nodeIds.has(target)) return;
      const childIds = children.get(source) ?? [];
      childIds.push(target);
      children.set(source, childIds);
      hasParent.add(target);
    });

    let root = rootId;
    if (!root) {
      this.model.forEachNode((node) => {
        if (root === undefined && !hasParent.has(String(node.id))) root = String(node.id);
      });
    }
    if (root === undefined) {
      this.model.forEachNode((node) => {
        if (root === undefined) root = String(node.id);
      });
    }
    if (root === undefined) return;

    const nPalette = nodeColors ?? (nodeColors === undefined ? undefined : DEFAULT_PALETTE);
    const ePalette = edgeColors ?? (edgeColors === undefined ? undefined : DEFAULT_PALETTE);
    const positions = new Map<string, { x: number; y: number; depth: number }>();
    const visited = new Set<string>();
    const stack: Array<{ id: string; depth: number }> = [{ id: root, depth: 0 }];
    let rowIndex = 0;

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) break;
      if (!nodeIds.has(current.id) || visited.has(current.id)) continue;
      visited.add(current.id);

      const x = direction === 'LR' ? current.depth * indent : -(current.depth * indent);
      const y = rowIndex * rowHeight;
      rowIndex += 1;
      positions.set(current.id, { x, y, depth: current.depth });

      const childIds = children.get(current.id) ?? [];
      for (let index = childIds.length - 1; index >= 0; index -= 1) {
        stack.push({ id: childIds[index], depth: current.depth + 1 });
      }
    }

    this.model.forEachNode((node) => {
      const position = positions.get(String(node.id));
      if (!position) {
        node.x = 0;
        node.y = 0;
        return;
      }

      node.x = position.x;
      node.y = position.y;
      const original = node._original as Record<string, unknown>;
      original.data = {
        ...(original.data as Record<string, unknown> | undefined),
        depth: position.depth,
        _isRoot: position.depth === 0,
      };
      const data = original.data as Record<string, unknown>;
      if (nPalette) data._nodeColor = nPalette[position.depth % nPalette.length];
      if (ePalette) data._edgeColor = ePalette[position.depth % ePalette.length];
    });
  }
}
