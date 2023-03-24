import type {
  Graph,
  Layout,
  LayoutMapping,
  PointTuple,
  OutNode,
  Node,
  Edge,
  DagreLayoutOptions,
} from "./types";
import { formatSizeFn, formatNumberFn, cloneFormatData } from "./util";
import { handleSingleNodeGraph } from "./util/common";

const DEFAULTS_LAYOUT_OPTIONS: Partial<DagreLayoutOptions> = {
  rankdir: "TB",
  nodesep: 50, // 节点水平间距(px)
  ranksep: 50, // 每一层节点之间间距
  controlPoints: false, // 是否保留布局连线的控制点
  radial: false, // 是否基于 dagre 进行辐射布局
  focusNode: null, // radial 为 true 时生效，关注的节点
};

/**
 * Layout arranging the nodes in a circle.
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = await layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = await layout.execute(graph, { radius: 20 }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * await layout.assign(graph, { radius: 20 });
 */
export class DagreLayout implements Layout<DagreLayoutOptions> {
  id = "dagre";

  constructor(public options: DagreLayoutOptions = {} as DagreLayoutOptions) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: Graph, options?: DagreLayoutOptions) {
    return this.genericDagreLayout(false, graph, options);
  }

  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: Graph, options?: DagreLayoutOptions) {
    await this.genericDagreLayout(true, graph, options);
  }

  private async genericDagreLayout(
    assign: false,
    graph: Graph,
    options?: DagreLayoutOptions
  ): Promise<LayoutMapping>;
  private async genericDagreLayout(
    assign: true,
    graph: Graph,
    options?: DagreLayoutOptions
  ): Promise<void>;
  private async genericDagreLayout(
    assign: boolean,
    graph: Graph,
    options?: DagreLayoutOptions
  ): Promise<LayoutMapping | void> {
    const mergedOptions = { ...this.options, ...options };
    const {} = mergedOptions;

    // const g = new DagreGraph({
    //   multigraph: true,
    //   compound: true,
    // });

    let nodes: Node[] = graph.getAllNodes();
    let edges: Edge[] = graph.getAllEdges();

    // calculated nodes as temporary result
    let layoutNodes: OutNode[] = [];
    // layout according to the original order in the data.nodes
    layoutNodes = nodes.map((node) => cloneFormatData(node) as OutNode);

    if (assign) {
      layoutNodes.forEach((node) => {
        graph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y,
        });
      });
    }

    const result = {
      nodes: layoutNodes,
      edges,
    };

    return result;
  }
}
