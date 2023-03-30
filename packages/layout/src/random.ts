import type {
  Graph,
  LayoutMapping,
  OutNode,
  PointTuple,
  RandomLayoutOptions,
  Layout,
} from "./types";

const DEFAULTS_LAYOUT_OPTIONS: Partial<RandomLayoutOptions> = {
  center: [0, 0],
  width: 300,
  height: 300,
};

/**
 * Layout randomizing the nodes' position
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new RandomLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new RandomLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph, { center: [100, 100] }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * await layout.assign(graph, { center: [100, 100] });
 */
export class RandomLayout implements Layout<RandomLayoutOptions> {
  id = "random";

  constructor(public options: RandomLayoutOptions = {} as RandomLayoutOptions) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: Graph, options?: RandomLayoutOptions) {
    return this.genericRandomLayout(false, graph, options);
  }
  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: Graph, options?: RandomLayoutOptions) {
    this.genericRandomLayout(true, graph, options);
  }

  private async genericRandomLayout(
    assign: false,
    graph: Graph,
    options?: RandomLayoutOptions
  ): Promise<LayoutMapping>;
  private async genericRandomLayout(
    assign: true,
    graph: Graph,
    options?: RandomLayoutOptions
  ): Promise<void>;
  private async genericRandomLayout(
    assign: boolean,
    graph: Graph,
    options?: RandomLayoutOptions
  ): Promise<LayoutMapping | void> {
    const mergedOptions = { ...this.options, ...options };
    const {
      center: propsCenter,
      width: propsWidth,
      height: propsHeight,
    } = mergedOptions;

    const nodes = graph.getAllNodes();
    const layoutScale = 0.9;
    const width =
      !propsWidth && typeof window !== "undefined"
        ? window.innerWidth
        : (propsWidth as number);
    const height =
      !propsHeight && typeof window !== "undefined"
        ? window.innerHeight
        : (propsHeight as number);
    const center = !propsCenter
      ? [width / 2, height / 2]
      : (propsCenter as PointTuple);

    const layoutNodes: OutNode[] = [];
    if (nodes) {
      nodes.forEach((node) => {
        layoutNodes.push({
          id: node.id,
          data: {
            x: (Math.random() - 0.5) * layoutScale * width + center[0],
            y: (Math.random() - 0.5) * layoutScale * height + center[1],
          },
        });
      });
    }

    if (assign) {
      layoutNodes.forEach((node) =>
        graph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y,
        })
      );
    }

    const result = {
      nodes: layoutNodes,
      edges: graph.getAllEdges(),
    };

    return result;
  }
}
