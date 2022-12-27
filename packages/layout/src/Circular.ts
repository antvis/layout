import type { Graph } from "@antv/graphlib";
import type { CircularLayoutOptions, SyncLayout, LayoutMapping, PointTuple, IndexMap, OutNode, Edge, Degree } from "./types";
import { getDegree, getEdgeTerminal, getFuncByUnknownType, clone } from "./util";

type INodeData = OutNode & {
  degree: number;
  size: number | PointTuple;
  weight: number;
  children: string[];
  parent: string[];
};

type IEdgeData = {};

const DEFAULTS_LAYOUT_OPTIONS: Partial<CircularLayoutOptions> = {
  radius: null,
  startRadius: null,
  endRadius: null,
  startAngle: 0,
  endAngle: 2 * Math.PI,
  clockwise: true,
  divisions: 1,
  ordering: null,
  angleRatio: 1
}

/**
 * Layout arranging the nodes in a circle.
 * 
 * @example
 * // Assign layout options when initialization.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = layout.execute(graph); // { nodes: [], edges: [] }
 * 
 * // Or use different options later.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = layout.execute(graph, { radius: 20 }); // { nodes: [], edges: [] }
 * 
 * // If you want to assign the positions directly to the nodes, use assign method.
 * layout.assign(graph, { radius: 20 });
 */
export class CircularLayout implements SyncLayout<CircularLayoutOptions> {
  constructor(private options: CircularLayoutOptions = {} as CircularLayoutOptions) {
    Object.assign(this.options, DEFAULTS_LAYOUT_OPTIONS, options);
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph<INodeData, IEdgeData>, options?: CircularLayoutOptions): LayoutMapping {
    return this.genericCircularLayout(false, graph, options) as LayoutMapping;
  }

  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph<INodeData, IEdgeData>, options?: CircularLayoutOptions) {
    graph.batch(() => {
      this.genericCircularLayout(true, graph, options);
    });
  }

  private genericCircularLayout(assign: boolean, graph: Graph<INodeData, IEdgeData>, options?: CircularLayoutOptions): LayoutMapping | void {
    const mergedOptions = { ...this.options, ...options };
    const { width, height, center, divisions, startAngle = 0, endAngle = 2 * Math.PI, angleRatio, ordering, clockwise, nodeSpacing: paramNodeSpacing, nodeSize: paramNodeSize, onLayoutEnd } = mergedOptions;

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges() as Edge[];
    const n = nodes.length;

    // Need no layout if there is no node.
    if (n === 0) {
      if (onLayoutEnd) {
        onLayoutEnd();
      }
      return {
        nodes: [],
        edges: [],
      };
    }

    // Calculate center according to `window` if not provided.
    const [calculatedWidth, calculatedHeight, calculatedCenter] = calculateCenter(width, height, center);

    // Layout easily if there is only one node.
    if (n === 1) {
      if (assign) {
        graph.updateNodeData(nodes[0].id, "x", calculatedCenter[0]);
        graph.updateNodeData(nodes[0].id, "y", calculatedCenter[1]);
      }
      
      if (onLayoutEnd) {
        onLayoutEnd();
      }
      return {
        nodes: [
          {
            id: `${nodes[0].id}`,
            x: calculatedCenter[0],
            y: calculatedCenter[1],
          }
        ],
        edges: [],
      };
    }

    const angleStep = (endAngle - startAngle) / n;
    const nodeMap: IndexMap = {};
    nodes.forEach((node, i) => {
      nodeMap[node.id] = i;
    });
    const degrees = getDegree(nodes.length, nodeMap, edges as Edge[]);

    let { radius, startRadius, endRadius } = mergedOptions;
    if (paramNodeSpacing) {
      const nodeSpacing: Function = getFuncByUnknownType(10, paramNodeSpacing);
      const nodeSize: Function = getFuncByUnknownType(10, paramNodeSize);
      let maxNodeSize = -Infinity;
      nodes.forEach((node) => {
        const nSize = nodeSize(node);
        if (maxNodeSize < nSize) maxNodeSize = nSize;
      });
      let length = 0;
      nodes.forEach((node, i) => {
        if (i === 0) length += (maxNodeSize || 10);
        else length += (nodeSpacing(node) || 0) + (maxNodeSize || 10);
      });
      radius = length / (2 * Math.PI);
    } else if (!radius && !startRadius && !endRadius) {
      radius = calculatedHeight > calculatedWidth ? calculatedWidth / 2 : calculatedHeight / 2;
    } else if (!startRadius && endRadius) {
      startRadius = endRadius;
    } else if (startRadius && !endRadius) {
      endRadius = startRadius;
    }
    const astep = angleStep * angleRatio!;

    let layoutNodes: any[] = [];
    let nodesData = nodes.map((node) => node.data);
    if (ordering === "topology") {
      // layout according to the topology
      layoutNodes = topologyOrdering(degrees, nodesData, edges, nodeMap);
    } else if (ordering === "topology-directed") {
      // layout according to the topology
      layoutNodes = topologyOrdering(degrees, nodesData, edges, nodeMap, true);
    } else if (ordering === "degree") {
      // layout according to the descent order of degrees
      layoutNodes = degreeOrdering(degrees, nodesData);
    } else {
      // layout according to the original order in the data.nodes
      layoutNodes = nodes;
    }

    const divN = Math.ceil(n / divisions!); // node number in each division
    for (let i = 0; i < n; ++i) {
      let r = radius;
      if (!r && startRadius !== null && endRadius !== null) {
        r = startRadius! + (i * (endRadius! - startRadius!)) / (n - 1);
      }
      if (!r) {
        r = 10 + (i * 100) / (n - 1);
      }
      let angle =
        startAngle +
        (i % divN) * astep +
        ((2 * Math.PI) / divisions!) * Math.floor(i / divN);
      if (!clockwise) {
        angle =
          endAngle -
          (i % divN) * astep -
          ((2 * Math.PI) / divisions!) * Math.floor(i / divN);
      }
      layoutNodes[i].x = calculatedCenter[0] + Math.cos(angle) * r;
      layoutNodes[i].y = calculatedCenter[1] + Math.sin(angle) * r;
      layoutNodes[i].weight = degrees[i].all;
    }

    if (assign) {
      layoutNodes.forEach((node) => {
        graph.mergeNodeData(node.id, {
          x: node.x,
          y: node.y,
          weight: node.weight,
        });
      });
    }

    if (onLayoutEnd) {
      onLayoutEnd();
    };

    return {
      nodes: layoutNodes,
      edges
    };
  }
}

function initHierarchy(
  nodes: INodeData[],
  edges: Edge[],
  nodeMap: IndexMap,
  directed: boolean
) {
  nodes.forEach((_, i: number) => {
    nodes[i].children = [];
    nodes[i].parent = [];
  });
  if (directed) {
    edges.forEach((e) => {
      const source = getEdgeTerminal(e, 'source');
      const target = getEdgeTerminal(e, 'target');
      let sourceIdx = 0;
      if (source) {
        sourceIdx = nodeMap[source];
      }
      let targetIdx = 0;
      if (target) {
        targetIdx = nodeMap[target];
      }
      const child = nodes[sourceIdx].children!;
      const parent = nodes[targetIdx].parent!;
      child.push(nodes[targetIdx].id);
      parent.push(nodes[sourceIdx].id);
    });
  } else {
    edges.forEach((e) => {
      const source = getEdgeTerminal(e, 'source');
      const target = getEdgeTerminal(e, 'target');
      let sourceIdx = 0;
      if (source) {
        sourceIdx = nodeMap[source];
      }
      let targetIdx = 0;
      if (target) {
        targetIdx = nodeMap[target];
      }
      const sourceChildren = nodes[sourceIdx].children!;
      const targetChildren = nodes[targetIdx].children!;
      sourceChildren.push(nodes[targetIdx].id);
      targetChildren.push(nodes[sourceIdx].id);
    });
  }
}

function connect(a: INodeData, b: INodeData, edges: Edge[]) {
  const m = edges.length;
  for (let i = 0; i < m; i++) {
    const source = getEdgeTerminal(edges[i], 'source');
    const target = getEdgeTerminal(edges[i], 'target');
    if (
      (a.id === source && b.id === target) ||
      (b.id === source && a.id === target)
    ) {
      return true;
    }
  }
  return false;
}

function compareDegree(a: INodeData, b: INodeData) {
  const aDegree = a.degree!;
  const bDegree = b.degree!;
  if (aDegree < bDegree) {
    return -1;
  }
  if (aDegree > bDegree) {
    return 1;
  }
  return 0;
}

function topologyOrdering(
  degrees: Degree[],
  nodes: INodeData[],
  edges: Edge[],
  nodeMap: IndexMap, 
  directed: boolean = false
) {
  const cnodes = clone(nodes);
  const orderedCNodes = [cnodes[0]];
  const resNodes = [nodes[0]];
  const pickFlags: boolean[] = [];
  const n = nodes.length;
  pickFlags[0] = true;
  initHierarchy(cnodes, edges, nodeMap, directed);
  let k = 0;
  cnodes.forEach((cnode, i) => {
    if (i !== 0) {
      if (
        (i === n - 1 ||
          degrees[i].all !== degrees[i + 1].all ||
          connect(
            orderedCNodes[k],
            cnode,
            edges
          )) &&
        !pickFlags[i]
      ) {
        orderedCNodes.push(cnode);
        resNodes.push(nodes[nodeMap[cnode.id]]);
        pickFlags[i] = true;
        k++;
      } else {
        const children = orderedCNodes[k].children!;
        let foundChild = false;
        for (let j = 0; j < children.length; j++) {
          const childIdx = nodeMap[children[j]];
          if (degrees[childIdx].all === degrees[i].all && !pickFlags[childIdx]) {
            orderedCNodes.push(cnodes[childIdx]);
            resNodes.push(nodes[nodeMap[cnodes[childIdx].id]]);
            pickFlags[childIdx] = true;
            foundChild = true;
            break;
          }
        }
        let ii = 0;
        while (!foundChild) {
          if (!pickFlags[ii]) {
            orderedCNodes.push(cnodes[ii]);
            resNodes.push(nodes[nodeMap[cnodes[ii].id]]);
            pickFlags[ii] = true;
            foundChild = true;
          }
          ii++;
          if (ii === n) {
            break;
          }
        }
      }
    }
  });
  return resNodes;
}

function degreeOrdering(
  degrees: Degree[],
  nodes: INodeData[],
): INodeData[] {
  const orderedNodes: INodeData[] = [];
  nodes.forEach((node, i) => {
    node.degree = degrees[i].all;
    orderedNodes.push(node);
  });
  orderedNodes.sort(compareDegree);
  return orderedNodes;
}

function calculateCenter(width: number | undefined, height: number | undefined, center: PointTuple | undefined): [number, number, PointTuple] {
  let calculatedWidth = width;
  let calculatedHeight = height;
  let calculatedCenter = center;
  if (!calculatedWidth && typeof window !== "undefined") {
    calculatedWidth = window.innerWidth;
  }
  if (!calculatedHeight && typeof window !== "undefined") {
    calculatedHeight = window.innerHeight;
  }
  if (!calculatedCenter) {
    calculatedCenter = [calculatedWidth! / 2, calculatedHeight! / 2];
  }
  return [calculatedWidth!, calculatedHeight!, calculatedCenter];
}