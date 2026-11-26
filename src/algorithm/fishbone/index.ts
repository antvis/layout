import type { GraphNode } from '../../types';
import { BaseLayout } from '../base-layout';
import type { FishboneLayoutOptions } from './types';

export type { FishboneLayoutOptions };

interface TreeNode {
  id: string;
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
  height: number;
  original: GraphNode;
}

/**
 * <zh/> 鱼骨图布局：根 → 分类 → 条目的三层结构。
 *
 * <en/> Fishbone layout (Ishikawa diagram): head -> categories -> items.
 */
export class FishboneLayout extends BaseLayout<FishboneLayoutOptions> {
  id = 'fishbone';

  protected getDefaultOptions(): Partial<FishboneLayoutOptions> {
    return {
      direction: 'LR',
      categoryGap: 180,
      itemHStep: 20,
      categoryDistance: 200,
      getWidth: () => 80,
      getHeight: () => 30,
    };
  }

  protected async layout(): Promise<void> {
    const {
      direction = 'LR',
      categoryGap = 180,
      itemHStep = 20,
      categoryDistance = 200,
      getWidth = () => 80,
      getHeight = () => 30,
    } = this.options;

    const nodeMap = new Map<string, TreeNode>();
    const childrenMap = new Map<string, string[]>();
    const hasParent = new Set<string>();

    this.model.forEachNode((node) => {
      const id = String(node.id);
      nodeMap.set(id, {
        id,
        children: [],
        x: 0,
        y: 0,
        width: getWidth(node),
        height: getHeight(node),
        original: node,
      });
    });

    this.model.forEachEdge((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);
      if (!nodeMap.has(source) || !nodeMap.has(target)) return;
      const childIds = childrenMap.get(source) ?? [];
      childIds.push(target);
      childrenMap.set(source, childIds);
      hasParent.add(target);
    });

    let rootId: string | undefined;
    this.model.forEachNode((node) => {
      if (rootId === undefined && !hasParent.has(String(node.id))) rootId = String(node.id);
    });
    const root = rootId ? nodeMap.get(rootId) : undefined;
    if (!root) return;

    const visited = new Set<string>([root.id]);
    const stack: Array<{ node: TreeNode; childIndex: number }> = [{ node: root, childIndex: 0 }];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const childIds = childrenMap.get(frame.node.id) ?? [];
      if (frame.childIndex >= childIds.length) {
        stack.pop();
        continue;
      }

      const childId = childIds[frame.childIndex];
      frame.childIndex += 1;
      const child = nodeMap.get(childId);
      if (!child || visited.has(childId)) continue;

      visited.add(childId);
      frame.node.children.push(child);
      stack.push({ node: child, childIndex: 0 });
    }

    const categories = root.children;
    const categoryCount = categories.length;

    if (categoryCount === 0) {
      root.x = 450;
      root.y = 300;
    } else {
      const centerY = categoryDistance + 80;
      const leftMargin = categoryDistance + 20;
      const spineLength = categoryCount * categoryGap;

      root.x = leftMargin + spineLength + root.width / 2;
      root.y = centerY;

      for (let index = 0; index < categoryCount; index += 1) {
        const category = categories[index];
        const verticalDirection = index % 2 === 0 ? -1 : 1;
        const spineX = leftMargin + (index + 0.5) * categoryGap;

        category.x = spineX - categoryDistance;
        category.y = centerY + verticalDirection * categoryDistance;

        const itemCount = category.children.length;
        for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
          const item = category.children[itemIndex];
          const ratio = (itemIndex + 1) / (itemCount + 1);
          const yOffset = ratio * categoryDistance;
          const meetX = category.x + yOffset;
          item.x = meetX - itemHStep - item.width / 2;
          item.y = category.y - verticalDirection * yOffset;
        }
      }

      if (direction === 'RL') {
        const totalWidth = leftMargin + spineLength + root.width;
        const pending = [root];
        while (pending.length > 0) {
          const node = pending.pop();
          if (!node) break;
          node.x = totalWidth - node.x;
          pending.push(...node.children);
        }
      }
    }

    const applyResult = (node: TreeNode): void => {
      node.original.x = node.x;
      node.original.y = node.y;
      node.children.forEach(applyResult);
    };

    applyResult(root);

    this.model.forEachNode((node) => {
      if (!visited.has(String(node.id))) {
        node.x = 0;
        node.y = 0;
      }
    });
  }
}
