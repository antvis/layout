import { isNumber } from "@antv/util";
import { Graph as IGraph } from "@antv/graphlib";
import type {
  Graph,
  LayoutMapping,
  OutNode,
  PointTuple,
  FruchtermanLayoutOptions,
  OutNodeData,
  Edge,
  EdgeData,
  Point,
  LayoutWithIterations,
} from "./types";
import { cloneFormatData } from "./util";

const DEFAULTS_LAYOUT_OPTIONS: Partial<FruchtermanLayoutOptions> = {
  maxIteration: 1000,
  gravity: 10,
  speed: 5,
  clustering: false,
  clusterGravity: 10,
  width: 300,
  height: 300,
  nodeClusterBy: "cluster",
};
const SPEED_DIVISOR = 800;

interface ClusterMap {
  [clusterName: string]: {
    name: string;
    cx: number;
    cy: number;
    count: number;
  };
}

type CalcGraph = IGraph<OutNodeData, EdgeData>;

type DisplacementMap = {
  [id: string]: Point;
};

interface FormattedOptions extends FruchtermanLayoutOptions {
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
 * const layout = new FruchtermanLayout({ center: [100, 100] });
 * const positions = layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new FruchtermanLayout({ center: [100, 100] });
 * const positions = layout.execute(graph, { center: [100, 100] }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * layout.assign(graph, { center: [100, 100] });
 */
export class FruchtermanLayout
  implements LayoutWithIterations<FruchtermanLayoutOptions>
{
  id = "fruchterman";

  private timeInterval: number = 0;

  private running: boolean = false;
  private lastLayoutNodes: OutNode[];
  private lastLayoutEdges: Edge[];
  private lastAssign: boolean;
  private lastGraph: IGraph<OutNodeData, EdgeData>;
  private lastOptions: FormattedOptions;
  private lastClusterMap: ClusterMap;
  private lastResult: LayoutMapping;

  constructor(
    public options: FruchtermanLayoutOptions = {} as FruchtermanLayoutOptions
  ) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph, options?: FruchtermanLayoutOptions): LayoutMapping {
    return this.genericFruchtermanLayout(
      false,
      graph,
      options
    ) as LayoutMapping;
  }
  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph, options?: FruchtermanLayoutOptions) {
    this.genericFruchtermanLayout(true, graph, options);
  }

  /**
   * Stop simulation immediately.
   */
  stop() {
    if (this.timeInterval && typeof window !== "undefined") {
      window.clearInterval(this.timeInterval);
    }
    this.running = false;
  }

  restart() {
    this.running = true;
  }

  /**
   * Manually steps the simulation by the specified number of iterations.
   * When finished it will trigger `onLayoutEnd` callback.
   * @see https://github.com/d3/d3-force#simulation_tick
   */
  tick(iterations = this.options.maxIteration || 1) {
    if (this.lastResult) {
      return this.lastResult;
    }

    for (let i = 0; i < iterations; i++) {
      this.runOneStep(this.lastGraph, this.lastClusterMap, this.lastOptions);
    }

    const result = {
      nodes: this.lastLayoutNodes,
      edges: this.lastLayoutEdges,
    };

    if (this.lastAssign) {
      result.nodes.forEach((node) =>
        this.lastGraph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y,
        })
      );
    }

    if (this.lastOptions.onLayoutEnd) {
      this.lastOptions.onLayoutEnd(result);
    }

    return result;
  }

  private genericFruchtermanLayout(
    assign: boolean,
    graph: Graph,
    options?: FruchtermanLayoutOptions
  ): LayoutMapping | void {
    if (this.running) return;

    const formattedOptions = this.formatOptions(options);
    const {
      layoutInvisibles,
      width,
      height,
      center,
      clustering,
      nodeClusterBy,
      maxIteration,
      onTick,
      onLayoutEnd,
    } = formattedOptions;

    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();
    // TODO: use graphlib's view with filter after graphlib supports it
    if (!layoutInvisibles) {
      nodes = nodes.filter((node) => {
        const { visible } = node.data || {};
        return visible || visible === undefined;
      });
      edges = edges.filter((edge) => {
        const { visible } = edge.data || {};
        return visible || visible === undefined;
      });
    }

    if (!nodes?.length) {
      const result = { nodes: [], edges };
      this.lastResult = result;
      onLayoutEnd?.(result);
      return result;
    }

    if (nodes.length === 1) {
      if (assign) {
        graph.mergeNodeData(nodes[0].id, {
          x: center[0],
          y: center[1],
        });
      }
      const result = {
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
      this.lastResult = result;
      onLayoutEnd?.(result);
      return result;
    }

    const layoutNodes: OutNode[] = nodes.map(
      (node) => cloneFormatData(node, [width, height]) as OutNode
    );
    const calcGraph = new IGraph<OutNodeData, EdgeData>({
      nodes: layoutNodes,
      edges,
    });

    // clustering info
    const clusterMap: ClusterMap = {};
    if (clustering) {
      layoutNodes.forEach((node) => {
        const clusterValue = node.data[nodeClusterBy] as string;
        if (!clusterMap[clusterValue]) {
          clusterMap[clusterValue] = {
            name: clusterValue,
            cx: 0,
            cy: 0,
            count: 0,
          };
        }
      });
    }

    // Use them later in `tick`.
    this.lastLayoutNodes = layoutNodes;
    this.lastLayoutEdges = edges;
    this.lastAssign = assign;
    this.lastGraph = calcGraph;
    this.lastOptions = formattedOptions;
    this.lastClusterMap = clusterMap;

    {
      if (typeof window === "undefined") return;
      let iter = 0;
      // interval for render the result after each iteration
      this.timeInterval = window.setInterval(() => {
        if (!this.running) {
          return;
        }

        this.runOneStep(calcGraph, clusterMap, formattedOptions);
        if (assign) {
          layoutNodes.forEach(({ id, data }) =>
            graph.mergeNodeData(id, {
              x: data.x,
              y: data.y,
            })
          );
        }
        onTick?.({
          nodes: layoutNodes,
          edges,
        });
        iter++;
        if (iter >= maxIteration) {
          // in case of onLayoutEnd faield leads to clearInterval not be called and endless loop
          try {
            onLayoutEnd?.({
              nodes: layoutNodes,
              edges,
            });
          } catch (e) {
            console.warn("onLayoutEnd failed", e);
          }
          window.clearInterval(this.timeInterval);
        }
      }, 0);
      this.running = true;
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

  private runOneStep(
    calcGraph: CalcGraph,
    clusterMap: ClusterMap,
    options: FormattedOptions
  ) {
    const {
      height,
      width,
      gravity,
      center,
      speed,
      clustering,
      nodeClusterBy,
      clusterGravity: propsClusterGravity,
    } = options;
    const area = height * width;
    const maxDisplace = Math.sqrt(area) / 10;
    const nodes = calcGraph.getAllNodes();
    const k2 = area / (nodes.length + 1);
    const k = Math.sqrt(k2);
    const displacements: DisplacementMap = {};
    this.applyCalculate(calcGraph, displacements, k, k2);

    // gravity for clusters
    if (clustering) {
      // reset the clustering centers
      for (const key in clusterMap) {
        clusterMap[key].cx = 0;
        clusterMap[key].cy = 0;
        clusterMap[key].count = 0;
      }
      // re-compute clustering centers
      nodes.forEach((node) => {
        const { data } = node; // node is one of layoutNodes, which is formatted and data field exists
        const c = clusterMap[data[nodeClusterBy] as string];
        if (isNumber(data.x)) {
          c.cx += data.x;
        }
        if (isNumber(data.y)) {
          c.cy += data.y;
        }
        c.count++;
      });
      for (const key in clusterMap) {
        clusterMap[key].cx /= clusterMap[key].count;
        clusterMap[key].cy /= clusterMap[key].count;
      }

      // compute the cluster gravity forces
      const clusterGravity = (propsClusterGravity || gravity) as number;
      nodes.forEach((node, j) => {
        const { id, data } = node;
        if (!isNumber(data.x) || !isNumber(data.y)) return;
        const c = clusterMap[data[nodeClusterBy] as string];
        const distLength = Math.sqrt(
          (data.x - c.cx) * (data.x - c.cx) + (data.y - c.cy) * (data.y - c.cy)
        );
        const gravityForce = k * clusterGravity;
        displacements[id].x -= (gravityForce * (data.x - c.cx)) / distLength;
        displacements[id].y -= (gravityForce * (data.y - c.cy)) / distLength;
      });
    }

    // gravity
    nodes.forEach((node, j) => {
      const { id, data } = node;
      if (!isNumber(data.x) || !isNumber(data.y)) return;
      const gravityForce = 0.01 * k * gravity;
      displacements[id].x -= gravityForce * (data.x - center[0]);
      displacements[id].y -= gravityForce * (data.y - center[1]);
    });

    // move
    nodes.forEach((node: OutNode, j) => {
      const { id, data } = node;
      if (isNumber(data.fx) && isNumber(data.fy)) {
        data.x = data.fx as number;
        data.y = data.fy as number;
        return;
      }
      if (!isNumber(data.x) || !isNumber(data.y)) return;
      const distLength = Math.sqrt(
        displacements[id].x * displacements[id].x +
          displacements[id].y * displacements[id].y
      );
      if (distLength > 0) {
        // && !n.isFixed()
        const limitedDist = Math.min(
          maxDisplace * (speed / SPEED_DIVISOR),
          distLength
        );
        calcGraph.mergeNodeData(id, {
          x: data.x + (displacements[id].x / distLength) * limitedDist,
          y: data.y + (displacements[id].y / distLength) * limitedDist,
        });
      }
    });
  }
  private applyCalculate(
    calcGraph: CalcGraph,
    displacements: DisplacementMap,
    k: number,
    k2: number
  ) {
    this.calRepulsive(calcGraph, displacements, k2);
    this.calAttractive(calcGraph, displacements, k);
  }

  private calRepulsive(
    calcGraph: CalcGraph,
    displacements: DisplacementMap,
    k2: number
  ) {
    const nodes = calcGraph.getAllNodes();
    nodes.forEach(({ data: v, id: vid }, i) => {
      displacements[vid] = { x: 0, y: 0 };
      nodes.forEach(({ data: u, id: uid }, j) => {
        if (
          i <= j ||
          !isNumber(v.x) ||
          !isNumber(u.x) ||
          !isNumber(v.y) ||
          !isNumber(u.y)
        ) {
          return;
        }
        let vecX = v.x - u.x;
        let vecY = v.y - u.y;
        let lengthSqr = vecX * vecX + vecY * vecY;
        if (lengthSqr === 0) {
          lengthSqr = 1;
          vecX = 0.01;
          vecY = 0.01;
        }
        const common = k2 / lengthSqr;
        const dispX = vecX * common;
        const dispY = vecY * common;
        displacements[vid].x += dispX;
        displacements[vid].y += dispY;
        displacements[uid].x -= dispX;
        displacements[uid].y -= dispY;
      });
    });
  }

  private calAttractive(
    calcGraph: CalcGraph,
    displacements: DisplacementMap,
    k: number
  ) {
    const edges = calcGraph.getAllEdges();
    edges.forEach((e) => {
      const { source, target } = e;
      if (!source || !target || source === target) {
        return;
      }
      const { data: u } = calcGraph.getNode(source);
      const { data: v } = calcGraph.getNode(target);
      if (
        !isNumber(v.x) ||
        !isNumber(u.x) ||
        !isNumber(v.y) ||
        !isNumber(u.y)
      ) {
        return;
      }
      const vecX = v.x - u.x;
      const vecY = v.y - u.y;
      const common = Math.sqrt(vecX * vecX + vecY * vecY) / k;
      const dispX = vecX * common;
      const dispY = vecY * common;
      displacements[source].x += dispX;
      displacements[source].y += dispY;
      displacements[target].x -= dispX;
      displacements[target].y -= dispY;
    });
  }
}
