import type {
  Matrix,
  Edge,
  Node,
  OutNode,
} from "../types";
import { isArray } from "./array";
import { isNumber } from "./number";

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

export const getAdjMatrix = (data: { nodes: Node[]; edges: Edge[] }, directed: boolean): Matrix[] => {
  const { nodes, edges } = data;
  const matrix: Matrix[] = [];
  // map node with index in data.nodes
  const nodeMap: {
    [key: string]: number;
  } = {};

  if (!nodes) {
    throw new Error("invalid nodes data!");
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
 * depth first traverse, from leaves to root, children in inverse order
 *  if the fn returns false, terminate the traverse
 */
const traverseUp = <T extends { children?: T[] }>(
  data: T,
  fn: (param: T) => boolean
) => {
  if (data && data.children) {
    for (let i = data.children.length - 1; i >= 0; i--) {
      if (!traverseUp(data.children[i], fn)) return;
    }
  }

  if (!fn(data)) {
    return false;
  }
  return true;
};

/**
 * depth first traverse, from leaves to root, children in inverse order
 * if the fn returns false, terminate the traverse
 */
export const traverseTreeUp = <T extends { children?: T[] }>(
  data: T,
  fn: (param: T) => boolean
) => {
  if (typeof fn !== "function") {
    return;
  }
  traverseUp(data, fn);
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
