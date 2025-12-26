import { Graph } from '@antv/graphlib';
import { isNumber } from '@antv/util';
import type { Matrix, NodeData, PointObject } from '../types';
import { isArray } from './array';
import type { GraphLib } from '../model/data';

/**
 * Floyd-Warshall algorithm to find shortest paths (but with no negative cycles).
 */
export const floydWarshall = (adjMatrix: Matrix): Matrix => {
  // initialize
  const n = adjMatrix.length;
  const dist = Array.from({ length: n }, () => new Array(n));

  for (let i = 0; i < n; i++) {
    const row = adjMatrix[i];
    const drow = dist[i];
    for (let j = 0; j < n; j++) {
      drow[j] = i === j ? 0 : row[j] > 0 ? row[j] : Infinity;
    }
  }

  // floyd
  for (let k = 0; k < n; k++) {
    const dk = dist[k];
    for (let i = 0; i < n; i++) {
      const di = dist[i];
      const dik = di[k];
      if (dik === Infinity) continue;

      for (let j = 0; j < n; j++) {
        const dkj = dk[j];
        if (dkj === Infinity) continue;

        const next = dik + dkj;
        if (next < di[j]) {
          di[j] = next;
        }
      }
    }
  }
  return dist;
};

/**
 * Get the adjacency matrix of the graph model.
 */
export const getAdjMatrix = (model: GraphLib, directed: boolean): Matrix => {
  const n = model.nodeCount();
  const matrix: Matrix = Array.from({ length: n }, () => new Array(n));

  // map node with index in data.nodes
  const nodeMap: { [key: string]: number } = {};

  let i = 0;
  model.forEachNode((node) => {
    nodeMap[node.id] = i++;
  });

  model.forEachEdge((e) => {
    const sIndex = nodeMap[e.source];
    const tIndex = nodeMap[e.target];
    if (sIndex === undefined || tIndex === undefined) return;

    matrix[sIndex][tIndex] = 1;
    if (!directed) {
      matrix[tIndex][sIndex] = 1;
    }
  });
  return matrix;
};

/**
 * Get the adjacency list of the graph model.
 */
export const getAdjList = (model: GraphLib, directed: boolean): Matrix => {
  const n = model.nodeCount();
  const adjList: Matrix = Array.from({ length: n }, () => [] as number[]);

  // map node with index
  const nodeMap: Record<string, number> = {};
  let idx = 0;
  model.forEachNode((node) => {
    nodeMap[node.id] = idx++;
  });

  model.forEachEdge((e) => {
    const s = nodeMap[e.source];
    const t = nodeMap[e.target];
    if (s == null || t == null) return;

    adjList[s].push(t);
    if (!directed) adjList[t].push(s);
  });

  return adjList;
};

/**
 * scale matrix
 * @param matrix [ [], [], [] ]
 * @param ratio
 */
export const scaleMatrix = (matrix: Matrix, ratio: number) => {
  const n = matrix.length;
  const result = new Array(n);

  for (let i = 0; i < n; i++) {
    const row = matrix[i];
    const m = row.length;
    const newRow = new Array(m);

    for (let j = 0; j < m; j++) {
      newRow[j] = row[j] * ratio;
    }
    result[i] = newRow;
  }

  return result;
};

/**
 * calculate the bounding box for the nodes according to their x, y, and size
 * @param nodes nodes in the layout
 * @returns
 */
export const getLayoutBBox = (nodes: NodeData[]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((node) => {
    let size = node.data.size;
    if (isArray(size)) {
      if (size.length === 1) size = [size[0], size[0]];
    } else if (size === undefined || isNaN(size as any)) {
      size = [30, 30];
    } else if (isNumber(size)) {
      size = [size, size];
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
export const getEuclideanDistance = (p1: PointObject, p2: PointObject) =>
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
  nodes: NodeData[],
  fn: (n: NodeData) => void,
  mode: 'TB' | 'BT' = 'TB',
  treeKey: string,
  stopFns: {
    stopBranchFn?: (node: NodeData) => boolean;
    stopAllFn?: (node: NodeData) => boolean;
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

/**
 * Use Johnson + Dijkstra to compute APSP for sparse graph.
 * Fully compatible with floydWarshall(adjMatrix).
 */

export function johnson(adjList: Matrix): Matrix {
  const n = adjList.length;

  // Step 1: add a dummy node q connected to all nodes with weight 0
  const h = new Array(n).fill(0);

  // Bellman-Ford to compute potentials h(v)
  // 因为权重全是 1，无负边，可直接跳过 BF，h 全 0 即可

  // Step 2: reweight edges
  // 因为 h(u)=h(v)=0，reweight 后仍然是 1，省略 reweight 过程

  // Step 3: run Dijkstra from each node
  const distAll: Matrix = Array.from({ length: n }, () =>
    new Array(n).fill(Infinity),
  );

  for (let s = 0; s < n; s++) {
    distAll[s] = dijkstra(adjList, s);
  }

  return distAll;
}

/**
 * Dijkstra algorithm to find shortest paths from source to all nodes.
 */
function dijkstra(adjList: number[][], source: number): number[] {
  const n = adjList.length;
  const dist = new Array(n).fill(Infinity);
  dist[source] = 0;

  // Minimal binary heap
  const heap = new MinHeap();
  heap.push([0, source]); // [distance, node]

  while (!heap.empty()) {
    const [d, u] = heap.pop();
    if (d !== dist[u]) continue;

    const neighbors = adjList[u];
    for (let i = 0; i < neighbors.length; i++) {
      const v = neighbors[i];
      const nd = d + 1;
      if (nd < dist[v]) {
        dist[v] = nd;
        heap.push([nd, v]);
      }
    }
  }

  return dist;
}

class MinHeap {
  private data: [number, number][] = [];

  push(item: [number, number]) {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): [number, number] {
    const top = this.data[0];
    const end = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = end;
      this.bubbleDown(0);
    }
    return top;
  }

  empty() {
    return this.data.length === 0;
  }

  private bubbleUp(pos: number) {
    const data = this.data;
    while (pos > 0) {
      const parent = (pos - 1) >> 1;
      if (data[parent][0] <= data[pos][0]) break;
      [data[parent], data[pos]] = [data[pos], data[parent]];
      pos = parent;
    }
  }

  private bubbleDown(pos: number) {
    const data = this.data;
    const length = data.length;

    while (true) {
      const left = pos * 2 + 1;
      const right = pos * 2 + 2;
      let min = pos;

      if (left < length && data[left][0] < data[min][0]) min = left;
      if (right < length && data[right][0] < data[min][0]) min = right;
      if (min === pos) break;

      [data[pos], data[min]] = [data[min], data[pos]];
      pos = min;
    }
  }
}
