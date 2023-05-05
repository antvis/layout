import {
  Graph,
  LayoutMapping,
  ForceLayoutOptions,
  Layout,
  OutNode,
  cloneFormatData,
} from "@antv/layout";
import { isNumber } from "@antv/util";
import { WASMLayoutOptions } from "./interface";
import { graphlib2WASMInput, distanceThresholdMode2Index } from "./util";

const DEFAULTS_LAYOUT_OPTIONS: Partial<ForceLayoutOptions> = {
  maxIteration: 500,
  gravity: 10,
  factor: 1,
  edgeStrength: 200,
  nodeStrength: 1000,
  coulombDisScale: 0.005,
  damping: 0.9,
  maxSpeed: 500,
  minMovement: 0.4,
  interval: 0.02,
  linkDistance: 200,
  clusterNodeStrength: 20,
  preventOverlap: true,
  distanceThresholdMode: "mean",
};

interface WASMForceLayoutOptions
  extends ForceLayoutOptions,
    WASMLayoutOptions {}

/**
 * Layout nodes with force model
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new ForceLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new ForceLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph, { center: [100, 100] }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * await layout.assign(graph, { center: [100, 100] });
 */
export class ForceLayout implements Layout<WASMForceLayoutOptions> {
  id = "forceWASM";

  constructor(
    public options: WASMForceLayoutOptions = {} as WASMForceLayoutOptions
  ) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: Graph, options?: WASMForceLayoutOptions) {
    return this.genericForceLayout(false, graph, options);
  }
  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: Graph, options?: WASMForceLayoutOptions) {
    this.genericForceLayout(true, graph, options);
  }

  private async genericForceLayout(
    assign: false,
    graph: Graph,
    options?: WASMForceLayoutOptions
  ): Promise<LayoutMapping>;
  private async genericForceLayout(
    assign: true,
    graph: Graph,
    options?: WASMForceLayoutOptions
  ): Promise<void>;
  private async genericForceLayout(
    assign: boolean,
    graph: Graph,
    options?: WASMForceLayoutOptions
  ): Promise<LayoutMapping | void> {
    const formattedOptions = this.formatOptions(options);
    const {
      threads,
      width,
      height,
      center,
      maxIteration,
      minMovement,
      distanceThresholdMode,
      gravity,
      factor,
      interval,
      damping,
      maxSpeed,
      edgeStrength,
      linkDistance,
      nodeStrength,
      coulombDisScale,
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

    const { nodes: positions } = await threads.force2({
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
      edge_strength: edgeStrength as number,
      link_distance: linkDistance as number,
      node_strength: nodeStrength as number,
      coulomb_dis_scale: coulombDisScale,
      kg: gravity,
      factor,
      interval,
      damping,
      max_speed: maxSpeed,
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

  /**
   * Format the options.
   * @param options input options
   * @param nodeNum number of nodes
   * @returns formatted options
   */
  private formatOptions(
    options: ForceLayoutOptions = {}
  ): WASMForceLayoutOptions {
    const mergedOptions = {
      ...this.options,
      ...options,
    } as WASMForceLayoutOptions;
    const { center, width, height } = mergedOptions;
    mergedOptions.width =
      !width && typeof window !== "undefined" ? window.innerWidth : width;
    mergedOptions.height =
      !height && typeof window !== "undefined" ? window.innerHeight : height;
    mergedOptions.center = !center
      ? [mergedOptions.width / 2, mergedOptions.height / 2]
      : center;
    return mergedOptions;
  }
}
