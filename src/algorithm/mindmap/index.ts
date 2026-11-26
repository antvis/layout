import type { GraphNode, ID } from '../../types';
import { BaseLayout } from '../base-layout';
import type { MindmapLayoutOptions } from './types';

export type { MindmapLayoutOptions };

type Side = 'left' | 'right';

interface TreeNode {
  graphNode: GraphNode;
  children: TreeNode[];
  width: number;
  height: number;
  side?: Side;
}

const DEFAULT_OPTIONS = {
  direction: 'H',
  levelGap: 120,
  nodeGap: 30,
} as const;

/**
 * <zh/> 思维导图布局
 *
 * <en/> Place the root at the origin and arrange branches on either side.
 */
export class MindmapLayout extends BaseLayout<MindmapLayoutOptions> {
  id = 'mindmap';

  protected getDefaultOptions(): MindmapLayoutOptions {
    return DEFAULT_OPTIONS;
  }

  protected async layout(options: MindmapLayoutOptions): Promise<void> {
    const {
      direction = DEFAULT_OPTIONS.direction,
      levelGap = DEFAULT_OPTIONS.levelGap,
      nodeGap = DEFAULT_OPTIONS.nodeGap,
      getWidth = () => 100,
      getHeight = () => 40,
      getSide = () => 'right',
    } = options;

    const nodes = this.model.nodes();
    if (nodes.length === 0) return;
    for (const node of nodes) {
      node.x = 0;
      node.y = 0;
    }

    const childrenById = new Map<ID, GraphNode[]>();
    const hasParent = new Set<ID>();
    this.model.forEachEdge(({ source, target }) => {
      if (source === target || hasParent.has(target)) return;
      const child = this.model.node(target);
      if (!child || !this.model.node(source)) return;

      const children = childrenById.get(source) ?? [];
      children.push(child);
      childrenById.set(source, children);
      hasParent.add(target);
    });

    const visited = new Set<ID>();
    const buildTree = (graphNode: GraphNode): TreeNode => {
      visited.add(graphNode.id);
      const children: TreeNode[] = [];
      const width = getWidth(graphNode._original);
      const height = getHeight(graphNode._original);
      for (const child of childrenById.get(graphNode.id) ?? []) {
        if (!visited.has(child.id)) children.push(buildTree(child));
      }
      return { graphNode, children, width, height };
    };

    const root = buildTree(
      nodes.find((node) => !hasParent.has(node.id)) ?? nodes[0],
    );
    const rootSide = direction === 'RL' ? 'left' : 'right';
    const assignSides = (node: TreeNode, parentSide?: Side): void => {
      node.children.forEach((child, index) => {
        child.side =
          node === root && direction !== 'H'
            ? rootSide
            : getSide(child.graphNode._original, index, parentSide);
      });
      node.children.forEach((child) => assignSides(child, node.side));
    };
    assignSides(root);

    const placeChildren = (node: TreeNode): void => {
      const left: TreeNode[] = [];
      const right: TreeNode[] = [];
      for (const child of node.children) {
        (child.side === 'left' ? left : right).push(child);
      }

      const placeSide = (children: TreeNode[], side: Side): void => {
        if (children.length === 0) return;
        const height = children.reduce(
          (total, child) => total + child.height,
          (children.length - 1) * nodeGap,
        );
        let y = node.graphNode.y - height / 2;
        const sign = side === 'left' ? -1 : 1;
        for (const child of children) {
          const x = node.width / 2 + levelGap + child.width / 2;
          child.graphNode.x = node.graphNode.x + sign * x;
          child.graphNode.y = y + child.height / 2;
          child.graphNode.side = side;
          y += child.height + nodeGap;
          placeChildren(child);
        }
      };

      placeSide(right, 'right');
      placeSide(left, 'left');
    };
    placeChildren(root);
  }
}
