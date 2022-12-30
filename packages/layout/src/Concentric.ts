import { Graph } from "@antv/graphlib";
import { Node, Edge, LayoutMapping, OutNode, PointTuple, ConcentricLayoutOptions, SyncLayout } from "./types";
import { clone, getDegree, isArray, isFunction, isNumber, isObject, isString } from "./util";

// maps node's id and its index in the nodes array
type IndexMap = {
  [nodeId: string]: number
}

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
  sortBy: "degree"
}

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
  constructor(private options: ConcentricLayoutOptions = {} as ConcentricLayoutOptions) {
    Object.assign(this.options, DEFAULTS_LAYOUT_OPTIONS, options);
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph<Node, Edge>, options?: ConcentricLayoutOptions): LayoutMapping {
    return this.genericConcentricLayout(false, graph, options) as LayoutMapping;
  }
  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph<Node, Edge>, options?: ConcentricLayoutOptions) {
    this.genericConcentricLayout(true, graph, options);
  }

  private genericConcentricLayout(assign: boolean, graph: Graph<Node, Edge>, options?: ConcentricLayoutOptions): LayoutMapping | void {
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
      layoutInvisibles
    } = mergedOptions;

    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();

    if (!layoutInvisibles) {
      nodes = nodes.filter(node => node.visible || node.visible === undefined);
      edges = edges.filter(edge => edge.visible || edge.visible === undefined);
    }
    
    const n = nodes.length;
    if (n === 0) {
      onLayoutEnd?.();
      return { nodes: [], edges };
    }

    const width = !propsWidth && typeof window !== "undefined" ? window.innerWidth : propsWidth as number;
    const height = !propsHeight && typeof window !== "undefined" ? window.innerHeight : propsHeight as number;
    const center = !propsCenter ? [width / 2, height / 2] : propsCenter as PointTuple;

    if (n === 1) {
      if (assign) {
        graph.mergeNodeData(nodes[0].id, {
          x: center[0],
          y: center[1]
        });
      }
      onLayoutEnd?.();
      return {
        nodes: [{
          ...nodes[0],
          x: center[0],
          y: center[1]
        }],
        edges
      };
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
      layoutNodes.push(clone(node));
      let nodeSize: number = maxNodeSize;
      if (isArray(node.size)) {
        nodeSize = Math.max(node.size[0], node.size[1]);
      } else if (isNumber(node.size)) {
        nodeSize = node.size;
      } else if (isObject(node.size)) {
        nodeSize = Math.max((node.size as any).width, (node.size as any).height);
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
    let sortBy = propsSortBy;
    if (
      !isString(sortBy) ||
      (layoutNodes[0] as any)[sortBy] === undefined
    ) {
      sortBy = "degree";
      if (!isNumber(nodes[0].degree)) {
        const values = getDegree(nodes.length, nodeIdxMap, edges);
        layoutNodes.forEach((node, i) => {
          node.degree = values[i].all;
        });
      }
    }
    // sort nodes by value
    layoutNodes.sort(
      (n1: Node, n2: Node) =>
        (n2 as any)[sortBy] - (n1 as any)[sortBy]
    );

    const maxValueNode = layoutNodes[0];

    const maxLevelDiff = propsMaxLevelDiff || (maxValueNode as any)[sortBy] / 4;

    // put the values into levels
    const levels: any[] = [[]];
    let currentLevel = levels[0];
    layoutNodes.forEach((node) => {
      if (currentLevel.length > 0) {
        const diff = Math.abs(
          currentLevel[0][sortBy] - (node as any)[sortBy]
        );
        if (maxLevelDiff && diff >= maxLevelDiff) {
          currentLevel = [];
          levels.push(currentLevel);
        }
      }
      currentLevel.push(node);
    });

    // create positions for levels
    let minDist = maxNodeSize + (maxNodeSpacing || minNodeSpacing); // min dist between nodes
    if (!preventOverlap) {
      // then strictly constrain to bb
      const firstLvlHasMulti = levels.length > 0 && levels[0].length > 1;
      const maxR = Math.min(width, height) / 2 - minDist;
      const rStep = maxR / (levels.length + (firstLvlHasMulti ? 1 : 0));

      minDist = Math.min(minDist, rStep);
    }

    // find the metrics for each level
    let r = 0;
    levels.forEach((level) => {
      const sweep = propsSweep === undefined ? 2 * Math.PI - (2 * Math.PI) / level.length : propsSweep;
      const dTheta = (level.dTheta = sweep / Math.max(1, level.length - 1));

      // calculate the radius
      if (level.length > 1 && preventOverlap) {
        // but only if more than one node (can't overlap)
        const dcos = Math.cos(dTheta) - Math.cos(0);
        const dsin = Math.sin(dTheta) - Math.sin(0);
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
        const rDelta = level.r - rr;
        rDeltaMax = Math.max(rDeltaMax, rDelta);
      }
      rr = 0;
      levels.forEach((level, i) => {
        if (i === 0) {
          rr = level.r;
        }
        level.r = rr;
        rr += rDeltaMax;
      });
    }

    // calculate the node positions
    levels.forEach((level) => {
      const dTheta = level.dTheta;
      const rr = level.r;
      level.forEach((node: Node, j: number) => {
        const theta = startAngle + (clockwise ? 1 : -1) * dTheta * j;
        node.x = center[0] + rr * Math.cos(theta);
        node.y = center[1] + rr * Math.sin(theta);
      });
    });

    if (assign) {
      layoutNodes.forEach(node => graph.mergeNodeData(node.id, {
        x: node.x,
        y: node.y
      }))
    }

    onLayoutEnd?.();

    return {
      nodes: layoutNodes,
      edges
    };
  }
}