import type { GraphNode } from '../../types';
import { BaseLayout } from '../base-layout';
import type { MindmapLayoutOptions } from './types';

export type { MindmapLayoutOptions };

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

interface TreeNode {
  id: string;
  data?: Record<string, unknown>;
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
  height: number;
  side?: 'left' | 'right';
  depth: number;
  original: GraphNode;
}

/**
 * <zh/> 脑图布局：根节点居中，子树向左右两侧展开。
 *
 * <en/> Mind map layout: root at center, children expand to left/right.
 */
export class MindmapLayout extends BaseLayout<MindmapLayoutOptions> {
  id = 'mindmap';

  protected getDefaultOptions(): Partial<MindmapLayoutOptions> {
    return {
      direction: 'H',
      levelGap: 120,
      nodeGap: 30,
      branchColors: DEFAULT_PALETTE,
      getWidth: () => 100,
      getHeight: () => 40,
      getSide: () => 'right',
    };
  }

  protected async layout(): Promise<void> {
    const {
      direction = 'H',
      levelGap = 120,
      nodeGap = 30,
      branchColors = DEFAULT_PALETTE,
      getWidth = () => 100,
      getHeight = () => 40,
      getSide = () => 'right',
    } = this.options;

    const nodeMap = new Map<string, TreeNode>();
    const childrenMap = new Map<string, string[]>();
    const hasParent = new Set<string>();

    this.model.forEachNode((node) => {
      const id = String(node.id);
      if (nodeMap.has(id)) return;
      nodeMap.set(id, {
        id,
        data: (node._original as Record<string, unknown>).data as Record<string, unknown> | undefined,
        children: [],
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        depth: 0,
        original: node,
      });
    });

    this.model.forEachEdge((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);
      if (source === target || !nodeMap.has(source) || !nodeMap.has(target)) return;
      if (hasParent.has(target)) return;
      const children = childrenMap.get(source) ?? [];
      if (children.includes(target)) return;
      children.push(target);
      childrenMap.set(source, children);
      hasParent.add(target);
    });

    let rootId: string | undefined;
    this.model.forEachNode((node) => {
      if (rootId === undefined && !hasParent.has(String(node.id))) rootId = String(node.id);
    });
    if (rootId === undefined) {
      this.model.forEachNode((node) => {
        if (rootId === undefined) rootId = String(node.id);
      });
    }
    const rootNode = rootId ? nodeMap.get(rootId) : undefined;
    if (!rootNode) return;

    const visited = new Set<string>();
    const visiting = new Set<string>();

    const buildChildren = (node: TreeNode, depth: number): void => {
      if (visiting.has(node.id) || visited.has(node.id)) return;
      visiting.add(node.id);
      visited.add(node.id);
      node.depth = depth;

      for (const childId of childrenMap.get(node.id) ?? []) {
        if (visiting.has(childId) || visited.has(childId)) continue;
        const child = nodeMap.get(childId);
        if (!child) continue;
        node.children.push(child);
        buildChildren(child, depth + 1);
      }

      visiting.delete(node.id);
    };

    buildChildren(rootNode, 0);

    const toCallbackNode = (node: TreeNode): GraphNode => node.original;

    const calculateSizes = (node: TreeNode): void => {
      const graphNode = toCallbackNode(node);
      node.width = getWidth(graphNode);
      node.height = getHeight(graphNode);
      node.children.forEach(calculateSizes);
    };

    const assignSides = (node: TreeNode, parentSide?: 'left' | 'right'): void => {
      if (node.children.length === 0) return;

      if (node.depth === 0) {
        if (direction === 'H') {
          node.children.forEach((child, index) => {
            child.side = getSide(toCallbackNode(child), index, undefined);
          });
        } else {
          const side = direction === 'LR' ? 'right' : 'left';
          node.children.forEach((child) => {
            child.side = side;
          });
        }
      } else {
        node.children.forEach((child, index) => {
          child.side = getSide(toCallbackNode(child), index, parentSide);
        });
      }

      node.children.forEach((child) => assignSides(child, child.side));
    };

    const assignBranchColor = (node: TreeNode, colorIndex: number): void => {
      if (branchColors.length > 0) {
        const color = branchColors[colorIndex % branchColors.length];
        node.data = { ...(node.data ?? {}), _branchColor: color };
      }
      node.children.forEach((child) => assignBranchColor(child, colorIndex));
    };

    const getChildrenHeight = (children: TreeNode[]): number => {
      if (children.length === 0) return 0;
      return children.reduce(
        (total, child, index) => total + child.height + (index < children.length - 1 ? nodeGap : 0),
        0,
      );
    };

    const calculatePositions = (node: TreeNode): void => {
      if (node.children.length === 0) return;

      const leftChildren: TreeNode[] = [];
      const rightChildren: TreeNode[] = [];
      for (const child of node.children) {
        (child.side === 'left' ? leftChildren : rightChildren).push(child);
      }

      if (rightChildren.length > 0) {
        let yOffset = node.y - getChildrenHeight(rightChildren) / 2;
        for (const child of rightChildren) {
          child.x = node.x + node.width / 2 + levelGap + child.width / 2;
          child.y = yOffset + child.height / 2;
          yOffset += child.height + nodeGap;
          assignBranchColor(child, 1);
          calculatePositions(child);
        }
      }

      if (leftChildren.length > 0) {
        let yOffset = node.y - getChildrenHeight(leftChildren) / 2;
        for (const child of leftChildren) {
          child.x = node.x - node.width / 2 - levelGap - child.width / 2;
          child.y = yOffset + child.height / 2;
          yOffset += child.height + nodeGap;
          assignBranchColor(child, 0);
          calculatePositions(child);
        }
      }
    };

    rootNode.x = 0;
    rootNode.y = 0;
    calculateSizes(rootNode);
    assignSides(rootNode);
    calculatePositions(rootNode);

    const applyResult = (node: TreeNode): void => {
      node.original.x = node.x;
      node.original.y = node.y;
      if (node.data) {
        (node.original._original as Record<string, unknown>).data = node.data;
      }
      node.children.forEach(applyResult);
    };

    applyResult(rootNode);

    this.model.forEachNode((node) => {
      if (!visited.has(String(node.id))) {
        node.x = 0;
        node.y = 0;
      }
    });
  }
}
