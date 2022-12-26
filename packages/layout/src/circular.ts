import type { Graph } from "@antv/graphlib";
import type { CircularLayoutOptions, SyncLayout, LayoutMapping, PointTuple, OutNode, Node, Edge, Degree } from "./types";
import { getDegree, getFuncByUnknownType, clone } from "./util";

// for circular's temporary result
interface CalcNode extends OutNode {
  data: {
    x: number,
    y: number,
    degree: number;
    size: number | PointTuple;
    children: string[];
    parent: string[];
  }
};

// maps node's id and its index in the nodes array
type IndexMap = {
  [nodeId: string]: number
}

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
  id = 'circular';

  constructor(public options: CircularLayoutOptions = {} as CircularLayoutOptions) {
    Object.assign(this.options, DEFAULTS_LAYOUT_OPTIONS, options);
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph<Node, Edge>, options?: CircularLayoutOptions): LayoutMapping {
    return this.genericCircularLayout(false, graph, options) as LayoutMapping;
  }

  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph<Node, Edge>, options?: CircularLayoutOptions) {
    graph.batch(() => {
      this.genericCircularLayout(true, graph, options);
    });
  }

  private genericCircularLayout(assign: boolean, graph: Graph<Node, Edge>, options?: CircularLayoutOptions): LayoutMapping | void {
    const mergedOptions = { ...this.options, ...options };
    const { width, height, center, divisions, startAngle = 0, endAngle = 2 * Math.PI, angleRatio, ordering, clockwise, nodeSpacing: paramNodeSpacing, nodeSize: paramNodeSize, onLayoutEnd } = mergedOptions;

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges() as Edge[];
    const n = nodes.length;

    // Need no layout if there is no node.
    if (n === 0) {
      onLayoutEnd?.();
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
        graph.updateNodeData(nodes[0].id, {
          // TODO: graphlib merges data or overlay the whole data object?
          data: {
            x: calculatedCenter[0],
            y: calculatedCenter[1],
          }
        });
      }

      if (onLayoutEnd) {
        onLayoutEnd();
      }
      return {
        nodes: [
          {
            id: `${nodes[0].id}`,
            data: {
              x: calculatedCenter[0],
              y: calculatedCenter[1],
            }
          }
        ],
        edges: [],
      };
    }

    const angleStep = (endAngle - startAngle) / n;
    // TODO: use the IndexMap instead of graphlib if it has
    const nodeIdxMap: IndexMap = {};
    nodes.forEach((node, i) => {
      nodeIdxMap[node.id] = i;
    });
    // TODO: use the api to get degrees of graphlib if it has
    const degrees = getDegree(nodes.length, nodeIdxMap, edges);

    let { radius, startRadius, endRadius } = mergedOptions;
    if (paramNodeSpacing) {
      const nodeSpacing: Function = getFuncByUnknownType(10, paramNodeSpacing);
      const nodeSize: Function = getFuncByUnknownType(10, paramNodeSize);
      let maxNodeSize = -Infinity;
      nodes.forEach((node) => {
        const nSize = nodeSize(node);
        if (maxNodeSize < nSize) maxNodeSize = nSize;
      });
      let perimeter = 0;
      nodes.forEach((node, i) => {
        if (i === 0) perimeter += (maxNodeSize || 10);
        else perimeter += (nodeSpacing(node) || 0) + (maxNodeSize || 10);
      });
      radius = perimeter / (2 * Math.PI);
    } else if (!radius && !startRadius && !endRadius) {
      radius = Math.min(calculatedHeight, calculatedWidth) / 2;
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
      layoutNodes = topologyOrdering(degrees, nodes, edges, nodeIdxMap);
    } else if (ordering === "topology-directed") {
      // layout according to the topology
      layoutNodes = topologyOrdering(degrees, nodes, edges, nodeIdxMap, true);
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
    }

    if (assign) {
      layoutNodes.forEach((node) => {
        // TODO: graphlib merges data or overlay the whole data object?
        graph.updateNodeData(node.id, {
          data: {
            x: node.x,
            y: node.y,
          }
        });
      });
    }

    onLayoutEnd?.();

    return {
      nodes: layoutNodes,
      edges
    };
  }
}

/**
 * assign children and parent to node's data field to represent hierarchy of graph topology
 * @param nodes 
 * @param edges 
 * @param nodeIdxMap 
 * @param directed 
 */
const initHierarchy = (
  nodes: CalcNode[],
  edges: Edge[],
  nodeIdxMap: IndexMap,
  directed: boolean
) => {
  nodes.forEach((_, i: number) => {
    nodes[i].data.children = [];
    nodes[i].data.parent = [];
  });
  if (directed) {
    edges.forEach((e) => {
      const { source, target } = e;
      let sourceIdx = 0;
      if (source) {
        sourceIdx = nodeIdxMap[source];
      }
      let targetIdx = 0;
      if (target) {
        targetIdx = nodeIdxMap[target];
      }
      const child = nodes[sourceIdx].data.children!;
      const parent = nodes[targetIdx].data.parent!;
      child.push(nodes[targetIdx].id);
      parent.push(nodes[sourceIdx].id);
    });
  } else {
    edges.forEach((e) => {
      const { source, target } = e;
      let sourceIdx = 0;
      if (source) {
        sourceIdx = nodeIdxMap[source];
      }
      let targetIdx = 0;
      if (target) {
        targetIdx = nodeIdxMap[target];
      }
      const sourceChildren = nodes[sourceIdx].data.children!;
      const targetChildren = nodes[targetIdx].data.children!;
      sourceChildren.push(nodes[targetIdx].id);
      targetChildren.push(nodes[sourceIdx].id);
    });
  }
}

/**
 * if the node a and b are connected
 * TODO: use graphlib's API instead if it has
 * @param {CalcNode} a 
 * @param {CalcNode} b 
 * @param {Edge[]} edges 
 * @returns {boolean}
 */
const connect = (a: CalcNode, b: CalcNode, edges: Edge[]): boolean => {
  const m = edges.length;
  for (let i = 0; i < m; i++) {
    const { source, target } = edges[i];
    if (
      (a.id === source && b.id === target) ||
      (b.id === source && a.id === target)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * order the nodes acoording to the graph topology
 * @param degrees 
 * @param nodes 
 * @param edges 
 * @param nodeIdxMap 
 * @param directed 
 * @returns 
 */
const topologyOrdering = (
  degrees: Degree[],
  nodes: Node[],
  edges: Edge[],
  nodeIdxMap: IndexMap,
  directed: boolean = false
) => {
  // temporary result with extra properties in data field
  const cnodes: CalcNode[] = clone(nodes) as CalcNode[];
  const orderedCNodes: CalcNode[] = [cnodes[0]];
  // output nodes
  const resNodes: Node[] = [nodes[0]];
  const pickFlags: boolean[] = [];
  const n = nodes.length;
  pickFlags[0] = true;
  initHierarchy(cnodes, edges, nodeIdxMap, directed);
  let k = 0;
  cnodes.forEach((cnode, i) => {
    if (i !== 0) {
      if (
        (i === n - 1 ||
          degrees[i].all !== degrees[i + 1].all ||
          connect( // TODO: use graphlib's API instead if it has
            orderedCNodes[k],
            cnode,
            edges
          )) &&
        !pickFlags[i]
      ) {
        orderedCNodes.push(cnode);
        resNodes.push(nodes[nodeIdxMap[cnode.id]]);
        pickFlags[i] = true;
        k++;
      } else {
        const children = orderedCNodes[k].data.children!;
        let foundChild = false;
        for (let j = 0; j < children.length; j++) {
          const childIdx = nodeIdxMap[children[j]];
          if (degrees[childIdx].all === degrees[i].all && !pickFlags[childIdx]) {
            orderedCNodes.push(cnodes[childIdx]);
            resNodes.push(nodes[nodeIdxMap[cnodes[childIdx].id]]);
            pickFlags[childIdx] = true;
            foundChild = true;
            break;
          }
        }
        let ii = 0;
        while (!foundChild) {
          if (!pickFlags[ii]) {
            orderedCNodes.push(cnodes[ii]);
            resNodes.push(nodes[nodeIdxMap[cnodes[ii].id]]);
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

/**
 * order the nodes according to their degree
 * @param degrees 
 * @param nodes 
 * @returns 
 */
function degreeOrdering(
  degrees: Degree[],
  nodes: Node[],
): Node[] {
  const orderedNodes: Node[] = [];
  const weightMap: { [id: string]: number } = {};
  nodes.forEach((node, i) => {
    weightMap[node.id] = degrees[i].all;
    orderedNodes.push(node);
  });
  orderedNodes.sort((nodeA: Node, nodeB: Node) => (weightMap[nodeA.id] - weightMap[nodeB.id]));
  return orderedNodes;
}

/**
 * format the invalide width and height, and get the center position 
 * @param width 
 * @param height 
 * @param center 
 * @returns 
 */
const calculateCenter = (
  width: number | undefined,
  height: number | undefined,
  center: PointTuple | undefined
): [number, number, PointTuple] => {
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