import type {
  Graph,
  Node,
  LayoutMapping,
  OutNode,
  PointTuple,
  ConcentricLayoutOptions,
  SyncLayout,
  IndexMap,
} from "./types";
import {
  clone,
  isArray,
  isFunction,
  isNumber,
  isObject,
  isString,
} from "./util";

const DEFAULTS_LAYOUT_OPTIONS: Partial<ConcentricLayoutOptions> = {
  nodeSize: 30,
  minNodeSpacing: 10,
  nodeSpacing: 10,
  preventOverlap: false,
  sweep: undefined,
  equidistant: false,
  startAngle: (3 / 2) * Math.PI,
  clockwise: true,
  maxLevelDiff: undefined,
  sortBy: "degree",
};

/**
 * Layout arranging the nodes in concentrics
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new ConcentricLayout({ nodeSpacing: 10 });
 * const positions = layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new ConcentricLayout({ nodeSpacing: 10});
 * const positions = layout.execute(graph, { nodeSpacing: 10 }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * layout.assign(graph, { nodeSpacing: 10 });
 */
export class ConcentricLayout implements SyncLayout<ConcentricLayoutOptions> {
  id = "concentric";

  constructor(
    public options: ConcentricLayoutOptions = {} as ConcentricLayoutOptions
  ) {
    Object.assign(this.options, DEFAULTS_LAYOUT_OPTIONS, options);
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph, options?: ConcentricLayoutOptions): LayoutMapping {
    return this.genericConcentricLayout(false, graph, options) as LayoutMapping;
  }
  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph, options?: ConcentricLayoutOptions) {
    this.genericConcentricLayout(true, graph, options);
  }

  private genericConcentricLayout(
    assign: boolean,
    graph: Graph,
    options?: ConcentricLayoutOptions
  ): LayoutMapping | void {
    const mergedOptions = { ...this.options, ...options };
    const {
      center: propsCenter,
      width: propsWidth,
      height: propsHeight,
      sortBy: propsSortBy,
      maxLevelDiff: propsMaxLevelDiff,
      sweep: propsSweep,
      clockwise,
      equidistant,
      minNodeSpacing = 10,
      preventOverlap,
      startAngle = (3 / 2) * Math.PI,
      nodeSize,
      nodeSpacing,
      layoutInvisibles,
      onLayoutEnd,
    } = mergedOptions;

    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();

    if (!layoutInvisibles) {
      nodes = nodes.filter(
        (node) => node.data.visible || node.data.visible === undefined
      );
      edges = edges.filter(
        (edge) => edge.data.visible || edge.data.visible === undefined
      );
    }

    const n = nodes.length;
    if (n === 0) {
      const result = { nodes: [], edges };
      onLayoutEnd?.(result);
      return result;
    }

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

    if (n === 1) {
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
      onLayoutEnd?.(result);
      return result;
    }

    const layoutNodes: OutNode[] = [];
    let maxNodeSize: number;
    let maxNodeSpacing: number = 0;
    if (isArray(nodeSize)) {
      maxNodeSize = Math.max(nodeSize[0], nodeSize[1]);
    } else {
      maxNodeSize = nodeSize as number;
    }
    if (isArray(nodeSpacing)) {
      maxNodeSpacing = Math.max(nodeSpacing[0], nodeSpacing[1]);
    } else if (isNumber(nodeSpacing)) {
      maxNodeSpacing = nodeSpacing;
    }
    nodes.forEach((node) => {
      layoutNodes.push(clone(node) as OutNode);
      let nodeSize: number = maxNodeSize;
      if (isArray(node.data.size)) {
        nodeSize = Math.max(node.data.size[0], node.data.size[1]);
      } else if (isNumber(node.data.size)) {
        nodeSize = node.data.size;
      } else if (isObject(node.data.size)) {
        nodeSize = Math.max(
          (node.data.size as any).width,
          (node.data.size as any).height
        );
      }
      maxNodeSize = Math.max(maxNodeSize, nodeSize);

      if (isFunction(nodeSpacing)) {
        maxNodeSpacing = Math.max(nodeSpacing(node), maxNodeSpacing);
      }
    });

    // layout
    const nodeIdxMap: IndexMap = {};
    layoutNodes.forEach((node, i) => {
      nodeIdxMap[node.id] = i;
    });

    // get the node degrees
    let sortBy = propsSortBy!;
    if (
      !isString(sortBy) ||
      (layoutNodes[0] as any).data[sortBy] === undefined
    ) {
      sortBy = "degree";
    }
    if (sortBy === "degree") {
      layoutNodes.sort(
        (n1: Node, n2: Node) =>
          graph.getDegree(n2.id, "both") - graph.getDegree(n1.id, "both")
      );
    } else {
      // sort nodes by value
      layoutNodes.sort(
        (n1: Node, n2: Node) =>
          (n2 as any).data[sortBy] - (n1 as any).data[sortBy]
      );
    }

    const maxValueNode = layoutNodes[0];

    const maxLevelDiff =
      propsMaxLevelDiff || (maxValueNode as any).data[sortBy] / 4;

    // put the values into levels
    const levels: {
      nodes: OutNode[];
      r?: number;
      dTheta?: number;
    }[] = [{ nodes: [] }];
    let currentLevel = levels[0];
    layoutNodes.forEach((node) => {
      if (currentLevel.nodes.length > 0) {
        const diff = Math.abs(
          currentLevel.nodes[0].data[sortBy] as number - (node as any).data[sortBy]
        );
        if (maxLevelDiff && diff >= maxLevelDiff) {
          currentLevel = { nodes: [] };
          levels.push(currentLevel);
        }
      }
      currentLevel.nodes.push(node);
    });

    // create positions for levels
    let minDist = maxNodeSize + (maxNodeSpacing || minNodeSpacing); // min dist between nodes
    if (!preventOverlap) {
      // then strictly constrain to bb
      const firstLvlHasMulti = levels.length > 0 && levels[0].nodes.length > 1;
      const maxR = Math.min(width, height) / 2 - minDist;
      const rStep = maxR / (levels.length + (firstLvlHasMulti ? 1 : 0));

      minDist = Math.min(minDist, rStep);
    }

    // find the metrics for each level
    let r = 0;
    levels.forEach((level) => {
      const sweep =
        propsSweep === undefined
          ? 2 * Math.PI - (2 * Math.PI) / level.nodes.length
          : propsSweep;
      level.dTheta = sweep / Math.max(1, level.nodes.length - 1);

      // calculate the radius
      if (level.nodes.length > 1 && preventOverlap) {
        // but only if more than one node (can't overlap)
        const dcos = Math.cos(level.dTheta) - Math.cos(0);
        const dsin = Math.sin(level.dTheta) - Math.sin(0);
        const rMin = Math.sqrt(
          (minDist * minDist) / (dcos * dcos + dsin * dsin)
        ); // s.t. no nodes overlapping

        r = Math.max(rMin, r);
      }
      level.r = r;
      r += minDist;
    });

    if (equidistant) {
      let rDeltaMax = 0;
      let rr = 0;
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const rDelta = (level.r || 0) - rr;
        rDeltaMax = Math.max(rDeltaMax, rDelta);
      }
      rr = 0;
      levels.forEach((level, i) => {
        if (i === 0) {
          rr = level.r || 0;
        }
        level.r = rr;
        rr += rDeltaMax;
      });
    }

    // calculate the node positions
    levels.forEach((level) => {
      const dTheta = level.dTheta || 0;
      const rr = level.r || 0;
      level.nodes.forEach((node: OutNode, j: number) => {
        const theta = startAngle + (clockwise ? 1 : -1) * dTheta * j;
        node.data.x = center[0] + rr * Math.cos(theta);
        node.data.y = center[1] + rr * Math.sin(theta);
      });
    });

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
      edges,
    };

    onLayoutEnd?.(result);

    return result;
  }
}
