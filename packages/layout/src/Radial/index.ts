import { Graph } from "@antv/graphlib";
import { Node, Edge, LayoutMapping, Matrix, OutNode, PointTuple, RadialLayoutOptions, SyncLayout } from "../types";
import { floydWarshall, getAdjMatrix, isArray, isFunction, isNumber, isObject, isString } from "../util";
import { mds } from "./mds";
import { radialNonoverlapForce, RadialNonoverlapForceOptions } from "./RadialNonoverlapForce";

const DEFAULTS_LAYOUT_OPTIONS: Partial<RadialLayoutOptions> = {
  maxIteration: 1000,
  focusNode: null,
  unitRadius: null,
  linkDistance: 50,
  preventOverlap: false,
  nodeSize: undefined,
  nodeSpacing: undefined,
  strictRadial: true,
  maxPreventOverlapIteration: 200,
  sortBy: undefined,
  sortStrength: 10
}

/**
 * Layout arranging the nodes' on a radial shape
 * 
 * @example
 * // Assign layout options when initialization.
 * const layout = new RadialLayout({ focusNode: 'node0' });
 * const positions = layout.execute(graph); // { nodes: [], edges: [] }
 * 
 * // Or use different options later.
 * const layout = new RadialLayout({ focusNode: 'node0' });
 * const positions = layout.execute(graph, { focusNode: 'node0' }); // { nodes: [], edges: [] }
 * 
 * // If you want to assign the positions directly to the nodes, use assign method.
 * layout.assign(graph, { focusNode: 'node0' });
 */
export class RadialLayout implements SyncLayout<RadialLayoutOptions> {
  constructor(private options: RadialLayoutOptions = {} as RadialLayoutOptions) {
    Object.assign(this.options, DEFAULTS_LAYOUT_OPTIONS, options);
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph<Node, Edge>, options?: RadialLayoutOptions): LayoutMapping {
    return this.genericRadialLayout(false, graph, options) as LayoutMapping;
  }
  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph<Node, Edge>, options?: RadialLayoutOptions) {
    this.genericRadialLayout(true, graph, options);
  }

  private genericRadialLayout(assign: boolean, graph: Graph<Node, Edge>, options?: RadialLayoutOptions): LayoutMapping | void {
    const mergedOptions = { ...this.options, ...options };
    const {
      width: propsWidth,
      height: propsHeight,
      center: propsCenter,
      focusNode: propsFocusNode,
      unitRadius: propsUnitRadius,
      nodeSize,
      nodeSpacing,
      strictRadial,
      preventOverlap,
      maxPreventOverlapIteration,
      sortBy,
      linkDistance = 50,
      sortStrength = 10,
      maxIteration = 1000,
      onLayoutEnd
    } = mergedOptions;

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();

    if (!nodes || nodes.length === 0) {
      onLayoutEnd?.();
      return { nodes: [], edges };
    }

    const width = !propsWidth && typeof window !== "undefined" ? window.innerWidth : propsWidth as number;
    const height = !propsHeight && typeof window !== "undefined" ? window.innerHeight : propsHeight as number;
    const center = !propsCenter ? [width / 2, height / 2] : propsCenter as PointTuple;

    if (nodes.length === 1) {
      nodes[0].x = center[0];
      nodes[0].y = center[1];
      onLayoutEnd?.();
      return;
    }
    // layout
    let focusNode: Node;
    if (isString(propsFocusNode)) {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === propsFocusNode) {
          focusNode = nodes[i];
          break;
        }
      }
    } else {
      focusNode = propsFocusNode as Node;
    }
    // default focus node
    if (!focusNode) {
      focusNode = nodes[0];
    }
    
    // the index of the focusNode in data
    let focusIndex = getIndexById(nodes, focusNode.id);
    if (focusIndex < 0) focusIndex = 0;

    // the graph-theoretic distance (shortest path distance) matrix
    const adjMatrix = getAdjMatrix({ nodes, edges }, false);
    const D = floydWarshall(adjMatrix);
    const maxDistance = maxToFocus(D, focusIndex);
    // replace first node in unconnected component to the circle at (maxDistance + 1)
    handleInfinity(D, focusIndex, maxDistance + 1);
    const distances = D;

    // the shortest path distance from each node to focusNode
    const focusNodeD = D[focusIndex];
    let semiWidth =
      width - center[0] > center[0] ? center[0] : width - center[0];
    let semiHeight =
      height - center[1] > center[1] ? center[1] : height - center[1];
    if (semiWidth === 0) {
      semiWidth = width / 2;
    }
    if (semiHeight === 0) {
      semiHeight = height / 2;
    }
    // the maxRadius of the graph
    const maxRadius = semiHeight > semiWidth ? semiWidth : semiHeight;
    const maxD = Math.max(...focusNodeD);
    // the radius for each nodes away from focusNode
    const radii: number[] = [];
    const unitRadius = !propsUnitRadius ?  maxRadius / maxD : propsUnitRadius;
    focusNodeD.forEach((value, i) => {
      radii[i] = value * unitRadius;
    });

    const idealDistances = eIdealDisMatrix(nodes, distances, linkDistance, radii, unitRadius, sortBy, sortStrength);
    // the weight matrix, Wij = 1 / dij^(-2)
    const weights = getWeightMatrix(idealDistances);

    // the initial positions from mds
    let positions = mds(linkDistance, idealDistances, linkDistance).map(([x, y]) => ({ x, y }));
    positions.forEach((p: OutNode) => {
      if (isNaN(p.x)) {
        p.x = Math.random() * linkDistance;
      }
      if (isNaN(p.y)) {
        p.y = Math.random() * linkDistance;
      }
    });
    positions.forEach((p: OutNode, i: number) => {
      nodes[i].x = p.x + center[0];
      nodes[i].y = p.y + center[1];
    });
    // move the graph to origin, centered at focusNode
    positions.forEach((p: OutNode) => {
      p.x -= positions[focusIndex].x;
      p.y -= positions[focusIndex].y;
    });

    this.run(maxIteration, positions, weights, idealDistances, radii, focusIndex);
    let nodeSizeFunc;
    // stagger the overlapped nodes
    if (preventOverlap) {
      nodeSizeFunc = formatNodeSize(nodeSize, nodeSpacing);
      const nonoverlapForceParams: RadialNonoverlapForceOptions = {
        nodes,
        nodeSizeFunc,
        positions,
        radii,
        height,
        width,
        strictRadial: Boolean(strictRadial),
        focusID: focusIndex,
        iterations: maxPreventOverlapIteration || 200,
        k: positions.length / 4.5
      };
      positions = radialNonoverlapForce(graph, nonoverlapForceParams)
    }
    // move the graph to center
    const layoutNodes: OutNode[] = [];
    positions.forEach((p: OutNode, i: number) => {
      layoutNodes.push({
        ...nodes[i],
        x: p.x,
        y: p.y
      })
    });

    if (assign) {
      layoutNodes.forEach(node => graph.mergeNodeData(node.id, {
        x: node.x,
        y: node.y
      }));
    }

    onLayoutEnd?.();

    return {
      nodes: layoutNodes,
      edges
    };
  }
  private run(
    maxIteration: number,
    positions: OutNode[],
    weights: Matrix[],
    idealDistances: Matrix[],
    radii: number[],
    focusIndex: number
  ) {
    for (let i = 0; i <= maxIteration; i++) {
      const param = i / maxIteration;
      this.oneIteration(param, positions, radii, idealDistances, weights, focusIndex);
    }
  }
  private oneIteration(
    param: number,
    positions: OutNode[],
    radii: number[],
    D: Matrix[],
    W: Matrix[],
    focusIndex: number
  ) {
    const vparam = 1 - param;
    positions.forEach((v: OutNode, i: number) => {
      // v
      const originDis = getEDistance(v, { x: 0, y: 0 });
      const reciODis = originDis === 0 ? 0 : 1 / originDis;
      if (i === focusIndex) {
        return;
      }
      let xMolecule = 0;
      let yMolecule = 0;
      let denominator = 0;
      positions.forEach((u, j) => {
        // u
        if (i === j) {
          return;
        }
        // the euclidean distance between v and u
        const edis = getEDistance(v, u);
        const reciEdis = edis === 0 ? 0 : 1 / edis;
        const idealDis = D[j][i];
        // same for x and y
        denominator += W[i][j];
        // x
        xMolecule += W[i][j] * (u.x + idealDis * (v.x - u.x) * reciEdis);
        // y
        yMolecule += W[i][j] * (u.y + idealDis * (v.y - u.y) * reciEdis);
      });
      const reciR = radii[i] === 0 ? 0 : 1 / radii[i];
      denominator *= vparam;
      denominator += param * reciR * reciR;
      // x
      xMolecule *= vparam;
      xMolecule += param * reciR * v.x * reciODis;
      v.x = xMolecule / denominator;
      // y
      yMolecule *= vparam;
      yMolecule += param * reciR * v.y * reciODis;
      v.y = yMolecule / denominator;
    });
  }
}

const eIdealDisMatrix = (
  nodes: Node[],
  distances: Matrix[],
  linkDistance: number,
  radii: number[],
  unitRadius: number,
  sortBy: string | undefined,
  sortStrength: number
): Matrix[] => {
  if (!nodes) return [];
  const result: Matrix[] = [];
  if (distances) {
    distances.forEach((row: number[], i: number) => {
      const newRow: Matrix = [];
      row.forEach((v, j) => {
        if (i === j) {
          newRow.push(0);
        } else if (radii[i] === radii[j]) {
          // i and j are on the same circle
          if (sortBy === "data") {
            // sort the nodes on the same circle according to the ordering of the data
            newRow.push(
              (v * (Math.abs(i - j) * sortStrength)) /
                (radii[i] / unitRadius)
            );
          } else if (sortBy) {
            // sort the nodes on the same circle according to the attributes
            let iValue: number | string =
              ((nodes[i] as any)[sortBy] as number | string) || 0;
            let jValue: number | string =
              ((nodes[j] as any)[sortBy] as number | string) || 0;
            if (isString(iValue)) {
              iValue = iValue.charCodeAt(0);
            }
            if (isString(jValue)) {
              jValue = jValue.charCodeAt(0);
            }
            newRow.push(
              (v * (Math.abs(iValue - jValue) * sortStrength)) /
                (radii[i] / unitRadius)
            );
          } else {
            newRow.push((v * linkDistance) / (radii[i] / unitRadius));
          }
        } else {
          // i and j are on different circle
          // i and j are on different circle
          const link = (linkDistance + unitRadius) / 2;
          newRow.push(v * link);
        }
      });
      result.push(newRow);
    });
  }
  return result;
}

const getWeightMatrix = (M: Matrix[]) => {
  const rows = M.length;
  const cols = M[0].length;
  const result = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      if (M[i][j] !== 0) {
        row.push(1 / (M[i][j] * M[i][j]));
      } else {
        row.push(0);
      }
    }
    result.push(row);
  }
  return result;
}

const getEDistance = (p1: OutNode, p2: OutNode) => {
  return Math.sqrt(
    (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
  );
}
const getIndexById = (array: any[], id: string) => {
  let index = -1;
  array.forEach((a, i) => {
    if (a.id === id) {
      index = i;
    }
  });
  return index;
}

const handleInfinity = (matrix: Matrix[], focusIndex: number, step: number) => {
  const length = matrix.length;
  // 遍历 matrix 中遍历 focus 对应行
  for (let i = 0; i < length; i++) {
    // matrix 关注点对应行的 Inf 项
    if (matrix[focusIndex][i] === Infinity) {
      matrix[focusIndex][i] = step;
      matrix[i][focusIndex] = step;
      // 遍历 matrix 中的 i 行，i 行中非 Inf 项若在 focus 行为 Inf，则替换 focus 行的那个 Inf
      for (let j = 0; j < length; j++) {
        if (matrix[i][j] !== Infinity && matrix[focusIndex][j] === Infinity) {
          matrix[focusIndex][j] = step + matrix[i][j];
          matrix[j][focusIndex] = step + matrix[i][j];
        }
      }
    }
  }
  // 处理其他行的 Inf。根据该行对应点与 focus 距离以及 Inf 项点 与 focus 距离，决定替换值
  for (let i = 0; i < length; i++) {
    if (i === focusIndex) {
      continue;
    }
    for (let j = 0; j < length; j++) {
      if (matrix[i][j] === Infinity) {
        let minus = Math.abs(matrix[focusIndex][i] - matrix[focusIndex][j]);
        minus = minus === 0 ? 1 : minus;
        matrix[i][j] = minus;
      }
    }
  }
}

const maxToFocus = (matrix: Matrix[], focusIndex: number): number => {
  let max = 0;
  for (let i = 0; i < matrix[focusIndex].length; i++) {
    if (matrix[focusIndex][i] === Infinity) {
      continue;
    }
    max = matrix[focusIndex][i] > max ? matrix[focusIndex][i] : max;
  }
  return max;
}

const formatNodeSize = (
  nodeSize: number | number[] | undefined,
  nodeSpacing: number | Function | undefined
): ((nodeData: Node) => number) => {
  let nodeSizeFunc;
  let nodeSpacingFunc: Function;
  if (isNumber(nodeSpacing)) {
    nodeSpacingFunc = () => nodeSpacing;
  } else if (isFunction(nodeSpacing)) {
    nodeSpacingFunc = nodeSpacing;
  } else {
    nodeSpacingFunc = () => 0;
  }

  if (!nodeSize) {
    nodeSizeFunc = (d: Node) => {
      if (d.bboxSize) {
        return Math.max(d.bboxSize[0], d.bboxSize[1]) + nodeSpacingFunc(d);
      }
      if (d.size) {
        if (isArray(d.size)) {
          return Math.max(d.size[0], d.size[1]) + nodeSpacingFunc(d);
        }  if (isObject(d.size)) {
          const res = d.size.width > d.size.height ? d.size.width : d.size.height;
          return res + nodeSpacingFunc(d);  
        }
        return d.size + nodeSpacingFunc(d);
      }
      return 10 + nodeSpacingFunc(d);
    };
  } else if (isArray(nodeSize)) {
    nodeSizeFunc = (d: Node) => {
      const res = nodeSize[0] > nodeSize[1] ? nodeSize[0] : nodeSize[1];
      return res + nodeSpacingFunc(d);
    };
  } else {
    nodeSizeFunc = (d: Node) => nodeSize + nodeSpacingFunc(d);
  }
  return nodeSizeFunc;
}