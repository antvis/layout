import type { Graph, CircularLayoutOptions, SyncLayout, LayoutMapping, PointTuple, OutNode, Node } from "./types";
import { getFuncByUnknownType, clone } from "./util";

// TODO: graph getDegree, getNeighbors, getSuccessors considering the hidden nodes according to layoutInvisible


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
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph, options?: CircularLayoutOptions): LayoutMapping {
    return this.genericCircularLayout(false, graph, options) as LayoutMapping;
  }

  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph, options?: CircularLayoutOptions) {
    graph.batch(() => {
      this.genericCircularLayout(true, graph, options);
    });
  }

  private genericCircularLayout(assign: boolean, graph: Graph, options?: CircularLayoutOptions): LayoutMapping | void {
    const mergedOptions = { ...this.options, ...options };
    const { width, height, center, divisions, startAngle = 0, endAngle = 2 * Math.PI, angleRatio, ordering, clockwise, nodeSpacing: paramNodeSpacing, nodeSize: paramNodeSize, layoutInvisibles, onLayoutEnd } = mergedOptions;

    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();

    if (!layoutInvisibles) {
      nodes = nodes.filter(node => node.data.visible || node.data.visible === undefined);
      edges = edges.filter(edge => edge.data.visible || edge.data.visible === undefined);
    }
    const n = nodes.length;

    // Need no layout if there is no node.
    if (n === 0) {
      onLayoutEnd?.({
        nodes: [],
        edges: [],
      });
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
        graph.mergeNodeData(nodes[0].id, {
            x: calculatedCenter[0],
            y: calculatedCenter[1],
        });
      }
      const result = {
        nodes: [
          {
            ...nodes[0],
            data: {
              ...nodes[0].data,
              x: calculatedCenter[0],
              y: calculatedCenter[1],
            }
          }
        ],
        edges,
      }
      onLayoutEnd?.(result);
      return result;
    }

    const angleStep = (endAngle - startAngle) / n;

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

    // calculated nodes as temporary result
    let layoutNodes: OutNode[] = [];
    if (ordering === "topology") {
      // layout according to the topology
      layoutNodes = topologyOrdering(graph, nodes);
    } else if (ordering === "topology-directed") {
      // layout according to the topology
      layoutNodes = topologyOrdering(graph, nodes, true);
    } else if (ordering === "degree") {
      // layout according to the descent order of degrees
      layoutNodes = degreeOrdering(graph, nodes);
    } else {
      // layout according to the original order in the data.nodes
      layoutNodes = nodes.map(node => clone(node) as OutNode);
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
      layoutNodes[i].data.x = calculatedCenter[0] + Math.cos(angle) * r;
      layoutNodes[i].data.y = calculatedCenter[1] + Math.sin(angle) * r;
    }

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
      edges
    }
    onLayoutEnd?.(result);

    return result;
  }
}

/**
 * order the nodes acoording to the graph topology
 * @param graph 
 * @param nodes 
 * @param directed 
 * @returns 
 */
const topologyOrdering = (
  graph: Graph,
  nodes: Node[],
  directed: boolean = false
) => {
  const orderedCNodes: OutNode[] = [clone(nodes[0]) as OutNode];
  const pickFlags: { [id: string]: boolean } = {};
  const n = nodes.length;
  pickFlags[nodes[0].id] = true;
  // write children into cnodes
  let k = 0;
  nodes.forEach((node, i) => {
    if (i !== 0) {
      if (
        (i === n - 1 ||
          graph.getDegree(node.id, 'both') !== graph.getDegree(nodes[i + 1].id, 'both') ||
          graph.areNeighbors(orderedCNodes[k].id, node.id)
        ) &&
        !pickFlags[node.id]
      ) {
        orderedCNodes.push(clone(node) as OutNode);
        pickFlags[node.id] = true;
        k++;
      } else {
        const children = directed ? graph.getSuccessors(orderedCNodes[k].id) : graph.getNeighbors(orderedCNodes[k].id);
        let foundChild = false;
        for (let j = 0; j < children.length; j++) {
          const child = children[j];
          if (graph.getDegree(child.id) === graph.getDegree(node.id) && !pickFlags[child.id]) {
            orderedCNodes.push(clone(child) as OutNode);
            pickFlags[child.id] = true;
            foundChild = true;
            break;
          }
        }
        let ii = 0;
        while (!foundChild) {
          if (!pickFlags[nodes[ii].id]) {
            orderedCNodes.push(clone(nodes[ii]) as OutNode);
            pickFlags[nodes[ii].id] = true;
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
  return orderedCNodes;
}

/**
 * order the nodes according to their degree
 * @param graph 
 * @param nodes 
 * @returns 
 */
function degreeOrdering(
  graph: Graph,
  nodes: Node[],
): OutNode[] {
  const orderedNodes: OutNode[] = [];
  nodes.forEach((node, i) => {
    orderedNodes.push(clone(node) as OutNode);
  });
  orderedNodes.sort((nodeA: Node, nodeB: Node) => (graph.getDegree(nodeA.id, 'both') - graph.getDegree(nodeB.id, 'both')));
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