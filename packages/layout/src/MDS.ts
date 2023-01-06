import { Matrix as MLMatrix, SingularValueDecomposition } from "ml-matrix";
import { Graph, Node, Edge, LayoutMapping, OutNode, PointTuple, MDSLayoutOptions, SyncLayout, Matrix } from "./types";
import { clone, floydWarshall, getAdjMatrix, scaleMatrix } from "./util";

const DEFAULTS_LAYOUT_OPTIONS: Partial<MDSLayoutOptions> = {
  center: [0, 0],
  linkDistance: 50
}

/**
 * Layout arranging the nodes with multiple dimensional scaling algorithm
 * 
 * @example
 * // Assign layout options when initialization.
 * const layout = new MDSLayout({ center: [100, 100] });
 * const positions = layout.execute(graph); // { nodes: [], edges: [] }
 * 
 * // Or use different options later.
 * const layout = new MDSLayout({ center: [100, 100] });
 * const positions = layout.execute(graph, { rows: 20 }); // { nodes: [], edges: [] }
 * 
 * // If you want to assign the positions directly to the nodes, use assign method.
 * layout.assign(graph, { center: [100, 100] });
 */
export class MDSLayout implements SyncLayout<MDSLayoutOptions> {
  id = 'mds'

  constructor(public options: MDSLayoutOptions = {} as MDSLayoutOptions) {
    Object.assign(this.options, DEFAULTS_LAYOUT_OPTIONS, options);
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph, options?: MDSLayoutOptions): LayoutMapping {
    return this.genericMDSLayout(false, graph, options) as LayoutMapping;
  }
  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph, options?: MDSLayoutOptions) {
    this.genericMDSLayout(true, graph, options);
  }

  private genericMDSLayout(assign: boolean, graph: Graph, options?: MDSLayoutOptions): LayoutMapping | void {
    const mergedOptions = { ...this.options, ...options };
    const { center = [0, 0], linkDistance = 50, layoutInvisibles, onLayoutEnd } = mergedOptions;
    
    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();

    if (!layoutInvisibles) {
      nodes = nodes.filter(node => node.data.visible || node.data.visible === undefined);
      edges = edges.filter(edge => edge.data.visible || edge.data.visible === undefined);
    }

    if (!nodes || nodes.length === 0) {
      const result = { nodes: [], edges };
      onLayoutEnd?.(result);
      return result;
    }
    if (nodes.length === 1) {
      if (assign) {
        graph.mergeNodeData(nodes[0].id, {
          x: center[0],
          y: center[1]
        });
      }
      const result = {
        nodes: [{
          ...nodes[0],
          data: {
            ...nodes[0].data,
            x: center[0],
            y: center[1]
          }
        }],
        edges
      }
      onLayoutEnd?.(result);
      return result;
    }

    // the graph-theoretic distance (shortest path distance) matrix
    const adjMatrix = getAdjMatrix({ nodes, edges }, false);
    const distances = floydWarshall(adjMatrix);
    handleInfinity(distances);

    // scale the ideal edge length acoording to linkDistance
    const scaledD = scaleMatrix(distances, linkDistance);

    // get positions by MDS
    const positions = runMDS(scaledD);
    const layoutNodes: OutNode[] = [];
    positions.forEach((p: number[], i: number) => {
      const cnode = clone(nodes[i]) as OutNode;
      cnode.data.x = p[0] + center[0];
      cnode.data.y = p[1] + center[1];
      layoutNodes.push(cnode);
    });

    if (assign) {
      layoutNodes.forEach(node => graph.mergeNodeData(node.id, {
        x: node.data.x,
        y: node.data.y
      }))
    }

    const result = {
      nodes: layoutNodes,
      edges
    };
    onLayoutEnd?.(result);

    return result;
  }
}

const handleInfinity = (distances: Matrix[]) => {
  let maxDistance = -999999;
  distances.forEach((row) => {
    row.forEach((value) => {
      if (value === Infinity) {
        return;
      }
      if (maxDistance < value) {
        maxDistance = value;
      }
    });
  });
  distances.forEach((row, i) => {
    row.forEach((value, j) => {
      if (value === Infinity) {
        distances[i][j] = maxDistance;
      }
    });
  });
}

/**
 * mds 算法
 * @return {array} positions 计算后的节点位置数组
 */
const runMDS = (distances: Matrix[]): PointTuple[] => {
  const dimension = 2;

  // square distances
  const M = MLMatrix.mul(MLMatrix.pow(distances, 2), -0.5);

  // double centre the rows/columns
  const rowMeans = M.mean("row");
  const colMeans = M.mean("column");
  const totalMean = M.mean();
  M.add(totalMean)
    .subRowVector(rowMeans)
    .subColumnVector(colMeans);

  // take the SVD of the double centred matrix, and return the
  // points from it
  const ret = new SingularValueDecomposition(M);
  const eigenValues = MLMatrix.sqrt(ret.diagonalMatrix).diagonal();
  return ret.leftSingularVectors.toJSON().map((row: number[]) => {
    return MLMatrix.mul([row], [eigenValues])
      .toJSON()[0]
      .splice(0, dimension) as PointTuple;
  });
}