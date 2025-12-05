import { Graph } from '@antv/graphlib';
import { isNumber } from '@antv/util';
import type { Matrix, Node, OutNode, Point } from '../types';
import { isArray } from './array';
import type { LayoutModel } from './model';

/**
 * Floyd-Warshall algorithm to find shortest paths (but with no negative cycles).
 */
export const floydWarshall = (adjMatrix: Matrix[]): Matrix[] => {
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
export const getAdjMatrix = (
  model: LayoutModel,
  directed: boolean,
): Matrix[] => {
  const n = model.nodeCount();
  const matrix: Matrix[] = Array.from({ length: n }, () => new Array(n));

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
 * scale matrix
 * @param matrix [ [], [], [] ]
 * @param ratio
 */
export const scaleMatrix = (matrix: Matrix[], ratio: number) => {
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
export const getLayoutBBox = (nodes: OutNode[]) => {
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

/**
 * Use Johnson + Dijkstra to compute APSP for sparse graph.
 * Fully compatible with floydWarshall(adjMatrix).
 */

export function johnsonAPSP(adjMatrix: number[][]): number[][] {
  const n = adjMatrix.length;
  if (n === 0) return [];

  // Step 1: Build edge list + adjacency list
  const edges: [number, number, number][] = [];
  const adj: [number, number][][] = Array.from({ length: n }, () => []);

  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      const w = adjMatrix[u][v];
      if (u !== v && w !== Infinity && w > 0) {
        edges.push([u, v, w]);
        adj[u].push([v, w]);
      }
    }
  }

  // Step 2: Bellman-Ford from virtual node Q (-1)
  const bfEdges = [...edges];
  for (let v = 0; v < n; v++) bfEdges.push([-1, v, 0]);

  const h = bellmanFord(bfEdges, n);
  if (!h) {
    throw new Error('Negative cycle detected in Johnson');
  }

  // Step 3: Reweight edges to eliminate negatives
  const reweightedAdj: [number, number][][] = Array.from(
    { length: n },
    () => [],
  );

  for (const [u, v, w] of edges) {
    const w2 = w + h[u] - h[v]; // guaranteed non-negative
    reweightedAdj[u].push([v, w2]);
  }

  // Step 4: Run Dijkstra from every node
  const dist: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(Infinity),
  );

  for (let s = 0; s < n; s++) {
    const d = dijkstra(reweightedAdj, s, n);

    for (let t = 0; t < n; t++) {
      if (d[t] < Infinity) {
        // restore original weights
        dist[s][t] = d[t] - h[s] + h[t];
      }
    }
  }

  return dist;
}

/**
 * Bellman-Ford algorithm to detect negative cycles only.
 * Time complexity: O(VE)
 */
function bellmanFord(
  edges: [number, number, number][],
  n: number,
): number[] | null {
  const dist = Array(n).fill(Infinity);
  // virtual source = node index n-1? (we use -1 offset)
  // actually we treat -1 separately; we initialize dist[any real node]=0
  // but must include them in Bellman-Ford.
  for (let v = 0; v < n; v++) dist[v] = 0;

  // Relax edges N-1 times
  for (let i = 0; i < n - 1; i++) {
    let updated = false;

    for (const [u, v, w] of edges) {
      const du = u === -1 ? 0 : dist[u];
      if (du + w < dist[v]) {
        dist[v] = du + w;
        updated = true;
      }
    }

    if (!updated) break;
  }

  // Check negative cycle
  for (const [u, v, w] of edges) {
    const du = u === -1 ? 0 : dist[u];
    if (du + w < dist[v]) return null;
  }

  return dist;
}

/**
 * Dijkstra's algorithm to find shortest paths from a single source.
 * Time complexity: O(E log V) with a binary heap.
 */
function dijkstra(
  adj: [number, number][][],
  start: number,
  n: number,
): number[] {
  const dist = Array(n).fill(Infinity);
  dist[start] = 0;

  const pq = new MinHeap<[number, number]>((a, b) => a[0] - b[0]);
  pq.push([0, start]);

  while (!pq.isEmpty()) {
    const [d, u] = pq.pop();
    if (d > dist[u]) continue;

    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        pq.push([nd, v]);
      }
    }
  }
  return dist;
}

/**
 * A simple MinHeap implementation.
 */
class MinHeap<T> {
  private data: T[] = [];
  private cmp: (a: T, b: T) => number;

  constructor(cmp: (a: T, b: T) => number) {
    this.cmp = cmp;
  }

  isEmpty() {
    return this.data.length === 0;
  }

  push(item: T) {
    const arr = this.data;
    arr.push(item);
    this.bubbleUp(arr.length - 1);
  }

  pop(): T {
    const arr = this.data;
    const top = arr[0];
    const tail = arr.pop()!;
    if (arr.length > 0) {
      arr[0] = tail;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(i: number) {
    const arr = this.data;
    const el = arr[i];
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.cmp(el, arr[p]) >= 0) break;
      arr[i] = arr[p];
      i = p;
    }
    arr[i] = el;
  }

  private bubbleDown(i: number) {
    const arr = this.data;
    const el = arr[i];
    const n = arr.length;

    while (true) {
      let left = i * 2 + 1;
      let right = left + 1;
      let smallest = i;

      if (left < n && this.cmp(arr[left], arr[smallest]) < 0) {
        smallest = left;
      }
      if (right < n && this.cmp(arr[right], arr[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === i) break;

      arr[i] = arr[smallest];
      i = smallest;
    }
    arr[i] = el;
  }
}
