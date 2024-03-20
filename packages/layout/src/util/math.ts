import { Graph } from '@antv/graphlib';
import { isNumber } from '@antv/util';
import type { Matrix, Edge, Node, OutNode, Point } from '../types';
import { isArray } from './array';

export const floydWarshall = (adjMatrix: Matrix[]): Matrix[] => {
  // initialize
  const dist: Matrix[] = [];
  const size = adjMatrix.length;
  for (let i = 0; i < size; i += 1) {
    dist[i] = [];
    for (let j = 0; j < size; j += 1) {
      if (i === j) {
        dist[i][j] = 0;
      } else if (adjMatrix[i][j] === 0 || !adjMatrix[i][j]) {
        dist[i][j] = Infinity;
      } else {
        dist[i][j] = adjMatrix[i][j];
      }
    }
  }
  // floyd
  for (let k = 0; k < size; k += 1) {
    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) {
        if (dist[i][j] > dist[i][k] + dist[k][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }
  return dist;
};

export const getAdjMatrix = (
  data: { nodes: Node[]; edges: Edge[] },
  directed: boolean,
): Matrix[] => {
  const { nodes, edges } = data;
  const matrix: Matrix[] = [];
  // map node with index in data.nodes
  const nodeMap: {
    [key: string]: number;
  } = {};

  if (!nodes) {
    throw new Error('invalid nodes data!');
  }
  if (nodes) {
    nodes.forEach((node, i) => {
      nodeMap[node.id] = i;
      const row: number[] = [];
      matrix.push(row);
    });
  }

  edges?.forEach((e) => {
    const { source, target } = e;
    const sIndex = nodeMap[source as string];
    const tIndex = nodeMap[target as string];
    if (sIndex === undefined || tIndex === undefined) return;
    matrix[sIndex][tIndex] = 1;
    if (!directed) {
      matrix[tIndex][sIndex] = 1;
    }
  });
  return matrix;
};

/**
 * scale matrix
 * @param matrix [ [], [], [] ]
 * @param ratio
 */
export const scaleMatrix = (matrix: Matrix[], ratio: number) => {
  const result: Matrix[] = [];
  matrix.forEach((row) => {
    const newRow: number[] = [];
    row.forEach((v) => {
      newRow.push(v * ratio);
    });
    result.push(newRow);
  });
  return result;
};

/**
 * calculate the bounding box for the nodes according to their x, y, and size
 * @param nodes nodes in the layout
 * @returns
 */
export const getLayoutBBox = (nodes: OutNode[]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((node) => {
    let size = node.data.size;
    if (isArray(size)) {
      if (size.length === 1) size = [size[0], size[0]];
    } else if (isNumber(size)) {
      size = [size, size];
    } else if (size === undefined || isNaN(size as any)) {
      size = [30, 30];
    }

    const halfSize = [size[0] / 2, size[1] / 2];
    const left = node.data.x - halfSize[0];
    const right = node.data.x + halfSize[0];
    const top = node.data.y - halfSize[1];
    const bottom = node.data.y + halfSize[1];

    if (minX > left) minX = left;
    if (minY > top) minY = top;
    if (maxX < right) maxX = right;
    if (maxY < bottom) maxY = bottom;
  });
  return { minX, minY, maxX, maxY };
};

/**
 * calculate the euclidean distance form p1 to p2
 * @param p1
 * @param p2
 * @returns
 */
export const getEuclideanDistance = (p1: Point, p2: Point) =>
  Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));

/**
 * Depth first search begin from nodes in graphCore data.
 * @param graphCore graphlib data structure
 * @param nodes begin nodes
 * @param fn will be called while visiting each node
 * @param mode 'TB' - visit from top to bottom; 'BT' - visit from bottom to top;
 * @returns
 */
export const graphTreeDfs = (
  graph: Graph<any, any>,
  nodes: Node[],
  fn: (n: Node) => void,
  mode: 'TB' | 'BT' = 'TB',
  treeKey: string,
  stopFns: {
    stopBranchFn?: (node: Node) => boolean;
    stopAllFn?: (node: Node) => boolean;
  } = {},
) => {
  if (!nodes?.length) return;
  const { stopBranchFn, stopAllFn } = stopFns;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!graph.hasNode(node.id)) continue;
    if (stopBranchFn?.(node)) continue; // Stop this branch
    if (stopAllFn?.(node)) return; // Stop all
    if (mode === 'TB') fn(node); // Traverse from top to bottom
    graphTreeDfs(
      graph,
      graph.getChildren(node.id, treeKey),
      fn,
      mode,
      treeKey,
      stopFns,
    );
    if (mode !== 'TB') fn(node); // Traverse from bottom to top
  }
};
