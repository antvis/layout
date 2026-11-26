import type { GraphNode, ID } from '../../types';
import { BaseLayout } from '../base-layout';
import type { FishboneLayoutOptions } from './types';

export type { FishboneLayoutOptions };

const DEFAULT_OPTIONS = {
  direction: 'LR',
  categoryGap: 180,
  itemHStep: 20,
  categoryDistance: 200,
} as const;

/**
 * <zh/> 鱼骨图布局
 *
 * <en/> Arrange categories and items of a two-level tree along a fishbone spine.
 */
export class FishboneLayout extends BaseLayout<FishboneLayoutOptions> {
  id = 'fishbone';

  protected getDefaultOptions(): FishboneLayoutOptions {
    return DEFAULT_OPTIONS;
  }

  protected async layout(options: FishboneLayoutOptions): Promise<void> {
    const {
      direction = DEFAULT_OPTIONS.direction,
      categoryGap = DEFAULT_OPTIONS.categoryGap,
      itemHStep = DEFAULT_OPTIONS.itemHStep,
      categoryDistance = DEFAULT_OPTIONS.categoryDistance,
      getWidth = () => 80,
    } = options;

    const nodes = this.model.nodes();
    for (const node of nodes) {
      node.x = 0;
      node.y = 0;
    }

    const root = nodes.find(
      (node) => this.model.predecessors(node.id).length === 0,
    );
    if (!root) return;

    const categories = this.model
      .successors(root.id)
      .map((id) => this.model.node(id)!);
    if (categories.length === 0) {
      root.x = 450;
      root.y = 300;
      return;
    }

    const centerY = categoryDistance + 80;
    const leftMargin = categoryDistance + 20;
    const spineLength = categories.length * categoryGap;
    const rootWidth = getWidth(root._original);
    const totalWidth = leftMargin + spineLength + rootWidth;
    const placeX = (x: number) => (direction === 'RL' ? totalWidth - x : x);
    const visited = new Set<ID>([root.id, ...categories.map(({ id }) => id)]);

    root.x = placeX(leftMargin + spineLength + rootWidth / 2);
    root.y = centerY;

    categories.forEach((category, index) => {
      const verticalDirection = index % 2 === 0 ? -1 : 1;
      const spineX = leftMargin + (index + 0.5) * categoryGap;
      const categoryX = spineX - categoryDistance;

      category.x = placeX(categoryX);
      category.y = centerY + verticalDirection * categoryDistance;

      const items: GraphNode[] = [];
      for (const id of this.model.successors(category.id)) {
        if (visited.has(id)) continue;
        visited.add(id);
        items.push(this.model.node(id)!);
      }
      items.forEach((item, itemIndex) => {
        const yOffset =
          ((itemIndex + 1) / (items.length + 1)) * categoryDistance;
        const meetX = categoryX + yOffset;
        item.x = placeX(meetX - itemHStep - getWidth(item._original) / 2);
        item.y = category.y - verticalDirection * yOffset;
      });
    });
  }
}
