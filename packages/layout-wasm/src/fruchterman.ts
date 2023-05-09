import {
  Graph,
  LayoutMapping,
  PointTuple,
  FruchtermanLayoutOptions,
  Layout,
  OutNode,
  cloneFormatData,
} from "@antv/layout";
import { isNumber } from "@antv/util";
import { WASMLayoutOptions } from "./interface";
import { graphlib2WASMInput, distanceThresholdMode2Index } from "./util";

const DEFAULTS_LAYOUT_OPTIONS: Partial<FruchtermanLayoutOptions> = {
  maxIteration: 1000,
  gravity: 10,
  speed: 5,
  clustering: false,
  clusterGravity: 10,
  width: 300,
  height: 300,
  nodeClusterBy: "cluster",
  maxDistance: Infinity,
};

interface WASMFruchtermanLayoutOptions
  extends FruchtermanLayoutOptions,
    WASMLayoutOptions {}

interface FormattedOptions extends WASMFruchtermanLayoutOptions {
  width: number;
  height: number;
  center: PointTuple;
  maxIteration: number;
  nodeClusterBy: string;
  gravity: number;
  speed: number;
}

/**
 * Layout with fructherman force model
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new FruchtermanLayout({ threads, center: [100, 100] });
 * const positions = await layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new FruchtermanLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph, { center: [100, 100] }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * await layout.assign(graph, { center: [100, 100] });
 */
export class FruchtermanLayout implements Layout<WASMFruchtermanLayoutOptions> {
  id = "fruchtermanWASM";

  constructor(
    public options: WASMFruchtermanLayoutOptions = {} as WASMFruchtermanLayoutOptions
  ) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: Graph, options?: FruchtermanLayoutOptions) {
    return this.genericFruchtermanLayout(false, graph, options);
  }
  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: Graph, options?: FruchtermanLayoutOptions) {
    this.genericFruchtermanLayout(true, graph, options);
  }

  private async genericFruchtermanLayout(
    assign: false,
    graph: Graph,
    options?: FruchtermanLayoutOptions
  ): Promise<LayoutMapping>;
  private async genericFruchtermanLayout(
    assign: true,
    graph: Graph,
    options?: FruchtermanLayoutOptions
  ): Promise<void>;
  private async genericFruchtermanLayout(
    assign: boolean,
    graph: Graph,
    options?: FruchtermanLayoutOptions
  ): Promise<LayoutMapping | void> {
    const formattedOptions = this.formatOptions(options);
    const {
      threads,
      width,
      height,
      center,
      // clustering,
      // clusterGravity,
      // nodeClusterBy,
      maxIteration,
      minMovement,
      distanceThresholdMode,
      gravity,
      speed,
      maxDistance,
    } = formattedOptions;

    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();

    if (!nodes?.length) {
      return { nodes: [], edges };
    }

    if (nodes.length === 1) {
      if (assign) {
        graph.mergeNodeData(nodes[0].id, {
          x: center[0],
          y: center[1],
        });
      }
      return {
        nodes: [
          {
            ...nodes[0],
            data: {
              ...nodes[0].data,
              x: center[0],
              y: center[1],
            },
          },
        ],
        edges,
      };
    }

    const layoutNodes: OutNode[] = nodes.map(
      (node) => cloneFormatData(node, [width, height]) as OutNode
    );
    layoutNodes.forEach((node, i) => {
      if (!isNumber(node.data.x)) node.data.x = Math.random() * width;
      if (!isNumber(node.data.y)) node.data.y = Math.random() * height;
    });

    const wasmInput = graphlib2WASMInput(layoutNodes, edges);

    const { nodes: positions } = await threads.fruchterman({
      nodes: wasmInput.nodes,
      edges: wasmInput.edges,
      masses: wasmInput.masses,
      weights: wasmInput.weights,
      iterations: maxIteration,
      min_movement: minMovement,
      distance_threshold_mode: distanceThresholdMode2Index(
        distanceThresholdMode
      ),
      center,
      height,
      width,
      kg: gravity,
      speed,
      max_distance: maxDistance,
    });

    layoutNodes.forEach((node, i) => {
      node.data.x = positions[2 * i];
      node.data.y = positions[2 * i + 1];
    });

    if (assign) {
      layoutNodes.forEach(({ id, data }) =>
        graph.mergeNodeData(id, {
          x: data.x,
          y: data.y,
        })
      );
    }

    return { nodes: layoutNodes, edges };
  }

  private formatOptions(
    options: FruchtermanLayoutOptions = {}
  ): FormattedOptions {
    const mergedOptions = { ...this.options, ...options } as FormattedOptions;
    const { clustering, nodeClusterBy } = mergedOptions;

    const {
      center: propsCenter,
      width: propsWidth,
      height: propsHeight,
    } = mergedOptions;
    mergedOptions.width =
      !propsWidth && typeof window !== "undefined"
        ? window.innerWidth
        : (propsWidth as number);
    mergedOptions.height =
      !propsHeight && typeof window !== "undefined"
        ? window.innerHeight
        : (propsHeight as number);
    mergedOptions.center = !propsCenter
      ? [mergedOptions.width / 2, mergedOptions.height / 2]
      : (propsCenter as PointTuple);

    mergedOptions.clustering = clustering && !!nodeClusterBy;

    return mergedOptions;
  }
}
