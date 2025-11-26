import type { Graph, Layout, LayoutMapping, OutNode } from '../types';
import type { GraphData } from '../types/data';
import { applySingleNodeLayout, normalizeViewport, toGraph } from '../util';
import type { RandomLayoutOptions } from './types';

const DEFAULTS_LAYOUT_OPTIONS: Partial<RandomLayoutOptions> = {
  center: [0, 0],
  width: 300,
  height: 300,
};

/**
 * <zh/> 随机布局
 *
 * <en/> Random layout
 */
export class RandomLayout implements Layout<RandomLayoutOptions> {
  id = 'random';

  constructor(public options: RandomLayoutOptions = {} as RandomLayoutOptions) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: GraphData | Graph, options?: RandomLayoutOptions) {
    return this.genericRandomLayout(false, toGraph(graph), options);
  }

  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: GraphData | Graph, options?: RandomLayoutOptions) {
    await this.genericRandomLayout(true, toGraph(graph), options);
  }

  private async genericRandomLayout(
    assign: false,
    graph: Graph,
    options?: RandomLayoutOptions,
  ): Promise<LayoutMapping>;
  private async genericRandomLayout(
    assign: true,
    graph: Graph,
    options?: RandomLayoutOptions,
  ): Promise<void>;
  private async genericRandomLayout(
    assign: boolean,
    graph: Graph,
    options: RandomLayoutOptions = {},
  ): Promise<LayoutMapping | void> {
    const mergedOptions = { ...this.options, ...options };
    const { width, height, center } = normalizeViewport(mergedOptions);
    const nodes = graph.getAllNodes();

    if (!nodes?.length || nodes.length === 1)
      return applySingleNodeLayout(assign, graph, center);

    const layoutScale = 0.9;
    const layoutNodes: OutNode[] = [];

    nodes.forEach((node) => {
      layoutNodes.push({
        id: node.id,
        data: {
          x: (Math.random() - 0.5) * layoutScale * width + center[0],
          y: (Math.random() - 0.5) * layoutScale * height + center[1],
        },
      });
    });

    if (assign) {
      layoutNodes.forEach((node) =>
        graph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y,
        }),
      );
    }

    const result = {
      nodes: layoutNodes,
      edges: graph.getAllEdges(),
    };

    return result;
  }
}
