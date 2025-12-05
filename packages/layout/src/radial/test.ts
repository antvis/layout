// Radial Layout — Performance Optimized (Complete Replacement)
// ------------------------------------------------------------------
// Goal: Keep full feature parity with original API while improving performance.
// Strategy summary (implemented here):
// 1. Adaptive shortest-path: choose floydWarshall or johnson based on sparsity.
// 2. Provide a low-allocation, heap-friendly Johnson implementation that accepts
//    either adjacency matrix or adjacency list to avoid repeated allocations.
// 3. Hot-path optimizations: index-based loops, local typed arrays for x/y,
//    minimize function calls in inner loops.
// 4. Reduced GC: avoid creating small arrays in inner loops; reuse buffers where safe.
// 5. MDS: assume runMDS stays as-is but only call it once; fallback to light-weight
//    random init if MDS returns NaNs.
// 6. Utility adapters provided at bottom (getAdjListFromMatrix, chooseAPSP).
// Usage: drop this file into your layout implementation and ensure imports for
// runMDS and util functions (formatNodeSizeToNumber, radialNonoverlapForce) remain available.

import { BaseLayout } from '../base-layout';
import { runMDS } from '../mds';
import type { Matrix } from '../types';
import type { LayoutNode } from '../types/data';
import type { ID } from '../types/id';
import {
  formatNodeSizeToNumber,
  getAdjMatrix,
  LayoutModel,
  normalizeViewport,
} from '../util';
import { applySingleNodeLayout } from '../util/common';
import {
  radialNonoverlapForce,
  RadialNonoverlapForceOptions,
} from './radial-nonoverlap-force';
import type { RadialLayoutOptions } from './types';

export type { RadialLayoutOptions };

const DEFAULTS_LAYOUT_OPTIONS: Partial<RadialLayoutOptions> = {
  focusNode: null,
  linkDistance: 50,
  maxIteration: 800,
  maxPreventOverlapIteration: 200,
  preventOverlap: false,
  sortStrength: 10,
  strictRadial: true,
  unitRadius: null,
};

/**
 * High-performance RadialLayout keeping original features.
 */
export class RadialLayout extends BaseLayout<RadialLayoutOptions> {
  id = 'radial';

  protected getDefaultOptions(): Partial<RadialLayoutOptions> {
    return DEFAULTS_LAYOUT_OPTIONS;
  }

  protected async layout(): Promise<void> {
    const { width, height, center } = normalizeViewport(this.options);
    const model = this.model;
    const n = model.nodeCount();
    if (!n || n === 1) return applySingleNodeLayout(model, center);

    const opts = this.options;
    const {
      focusNode: propsFocusNode,
      linkDistance = DEFAULTS_LAYOUT_OPTIONS.linkDistance,
      maxIteration = DEFAULTS_LAYOUT_OPTIONS.maxIteration,
      maxPreventOverlapIteration = DEFAULTS_LAYOUT_OPTIONS.maxPreventOverlapIteration,
      nodeSize,
      nodeSpacing,
      preventOverlap,
      sortBy,
      sortStrength = DEFAULTS_LAYOUT_OPTIONS.sortStrength,
      strictRadial,
      unitRadius: propsUnitRadius,
    } = opts;

    const focusNode =
      (propsFocusNode && model.node(propsFocusNode)) || model.firstNode();
    const focusIndex = model.nodeIndexOf(focusNode.id);

    // Build adjacency matrix once
    const adjMatrix = getAdjMatrix(model, false);

    // Choose APSP algorithm adaptively (sparsity and n)
    const distances = chooseAPSP(adjMatrix);

    // find max finite distance to focus
    const maxDistance = maxToFocus(distances, focusIndex);

    // replace infinities with estimations
    handleInfinity(distances, focusIndex, maxDistance + 1);

    const focusNodeD = distances[focusIndex];

    const semiWidth =
      (width - center[0] > center[0] ? center[0] : width - center[0]) ||
      width / 2;
    const semiHeight =
      (height - center[1] > center[1] ? center[1] : height - center[1]) ||
      height / 2;
    const maxRadius = Math.min(semiWidth, semiHeight);
    const maxD = Math.max(...focusNodeD);

    const unitRadius = propsUnitRadius ?? maxRadius / maxD;

    // Radii arrays and map
    const radii: number[] = new Array(n);
    const radiiMap: Map<ID, number> = new Map();

    // Using index-access to fill radii to avoid multiple model.nodeAt calls later
    for (let i = 0; i < n; i++) {
      const node = model.nodeAt(i);
      const r = focusNodeD[i] * unitRadius;
      radii[i] = r;
      radiiMap.set(node.id, r);
    }

    // Build ideal distance matrix (optimized)
    const idealDistances = eIdealDisMatrixOptimized(
      model,
      distances,
      linkDistance,
      radii,
      unitRadius,
      sortBy,
      sortStrength,
    );

    // MDS — init positions
    const mdsResult = runMDS(idealDistances, 2, linkDistance);
    // Ensure fallback if MDS returns NaN or invalids
    const mdsSafe = mdsFallback(mdsResult, n, linkDistance);
    const mdsFocusX = mdsSafe[focusIndex][0];
    const mdsFocusY = mdsSafe[focusIndex][1];

    // apply initial positions (centered at focus)
    for (let i = 0; i < n; i++) {
      const p = mdsSafe[i];
      const node = model.nodeAt(i);
      node.x = p[0] - mdsFocusX;
      node.y = p[1] - mdsFocusY;
    }

    // Iterative solver — optimized hot path
    this.runOptimized(model, maxIteration, idealDistances, radii, focusIndex);

    // Overlap handling (if requested)
    if (preventOverlap) {
      const nodeSizeFunc = formatNodeSizeToNumber(nodeSize, nodeSpacing);
      const params: RadialNonoverlapForceOptions = {
        nodeSizeFunc,
        radiiMap,
        width,
        strictRadial: Boolean(strictRadial),
        focusNode,
        maxIteration: maxPreventOverlapIteration,
        k: n / 4.5,
      };
      radialNonoverlapForce(model, params);
    }

    // translate to center
    for (let i = 0; i < n; i++) {
      const node = model.nodeAt(i);
      node.x += center[0];
      node.y += center[1];
    }
  }

  /**
   * Optimized run: use index loops, local typed arrays where beneficial.
   * Avoid calling model.forEachNode in inner loops.
   */
  private run(
    model: LayoutModel,
    maxIteration: number,
    idealDistances: Matrix[],
    radii: number[],
    focusIndex: number,
  ) {
    const n = model.nodeCount();

    // Precompute weight matrix once
    const weights = getWeightMatrix(idealDistances);

    // gather direct references to nodes array if model exposes; otherwise build array
    const nodes: LayoutNode[] = new Array(n);
    for (let i = 0; i < n; i++) nodes[i] = model.nodeAt(i);

    // local position arrays to reduce object access overhead
    const xs = new Float64Array(n);
    const ys = new Float64Array(n);

    for (let it = 0; it <= maxIteration; it++) {
      const param = it / maxIteration;
      const vparam = 1 - param;

      // update xs/ys snapshot
      for (let i = 0; i < n; i++) {
        xs[i] = nodes[i].x;
        ys[i] = nodes[i].y;
      }

      for (let i = 0; i < n; i++) {
        if (i === focusIndex) continue;

        const vx = xs[i];
        const vy = ys[i];
        const originDis = Math.sqrt(vx * vx + vy * vy);
        const reciODis = originDis === 0 ? 0 : 1 / originDis;

        let xMolecule = 0;
        let yMolecule = 0;
        let denominator = 0;

        const wRow = weights[i];
        const idRow = idealDistances[i];

        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const w = wRow[j];
          if (!w) continue; // skip zeros quickly

          const ux = xs[j];
          const uy = ys[j];

          const dx = vx - ux;
          const dy = vy - uy;
          const edis = Math.sqrt(dx * dx + dy * dy);
          const reciEdis = edis === 0 ? 0 : 1 / edis;
          const ideal = idRow[j];

          denominator += w;
          const k = ideal * reciEdis; // combine
          xMolecule += w * (ux + dx * k);
          yMolecule += w * (uy + dy * k);
        }

        const reciR = radii[i] === 0 ? 0 : 1 / radii[i];
        denominator = denominator * vparam + param * reciR * reciR;

        xMolecule = xMolecule * vparam + param * reciR * vx * reciODis;
        yMolecule = yMolecule * vparam + param * reciR * vy * reciODis;

        const nx = xMolecule / denominator;
        const ny = yMolecule / denominator;

        nodes[i].x = nx;
        nodes[i].y = ny;
      }
    }
  }
}

// ---------------------- Helper functions -------------------------

/**
 * Compute max finite distance from focus row
 */
const maxToFocus = (matrix: Matrix[], focusIndex: number): number => {
  const row = matrix[focusIndex];
  let max = 0;
  for (let i = 0; i < row.length; i++) {
    const v = row[i];
    if (v === Infinity) continue;
    if (v > max) max = v;
  }
  return max;
};

/**
 * Replace Infinity values with heuristic distances (optimized)
 */
const handleInfinity = (matrix: Matrix[], focusIndex: number, step: number) => {
  const n = matrix.length;
  const focusRow = matrix[focusIndex];

  // fill direct infinities in focus row
  for (let i = 0; i < n; i++) {
    if (focusRow[i] === Infinity) {
      focusRow[i] = step;
      matrix[i][focusIndex] = step;
    }
  }

  // fill others: use difference heuristic
  for (let i = 0; i < n; i++) {
    if (i === focusIndex) continue;
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] === Infinity) {
        let minus = Math.abs(focusRow[i] - focusRow[j]);
        if (minus === 0) minus = 1;
        matrix[i][j] = minus;
      }
    }
  }
};

/**
 * Optimized eIdealDisMatrix with fewer allocations and fewer lookups
 */
const eIdealDisMatrixOptimized = (
  model: LayoutModel,
  distances: Matrix[],
  linkDistance: number,
  radii: number[],
  unitRadius: number,
  sortBy: any,
  sortStrength: number,
): Matrix[] => {
  const n = distances.length;
  const result: Matrix[] = new Array(n);
  const radiusScale = new Array(n);
  for (let i = 0; i < n; i++) radiusScale[i] = radii[i] / unitRadius;

  const baseLink = (linkDistance + unitRadius) / 2;
  const sortCache = new Map<ID, number>();
  const sortFn = typeof sortBy === 'function' ? sortBy : null;
  const isDataSort = sortBy === 'data';

  for (let i = 0; i < n; i++) {
    const row = distances[i];
    const newRow = new Array(n);
    result[i] = newRow;
    const riScale = radiusScale[i] || 1;

    for (let j = 0; j < n; j++) {
      if (i === j) {
        newRow[j] = 0;
        continue;
      }

      const v = row[j];
      if (radii[i] === radii[j]) {
        if (isDataSort) {
          newRow[j] = (v * Math.abs(i - j) * sortStrength) / riScale;
        } else if (sortFn) {
          // cache node attribute values
          const nodeI = model.nodeAt(i);
          const nodeJ = model.nodeAt(j);
          let iv = sortCache.get(nodeI.id);
          if (iv === undefined) {
            const raw = sortFn(nodeI._original) || 0;
            iv = typeof raw === 'string' ? raw.charCodeAt(0) : Number(raw || 0);
            sortCache.set(nodeI.id, iv);
          }
          let jv = sortCache.get(nodeJ.id);
          if (jv === undefined) {
            const raw = sortFn(nodeJ._original) || 0;
            jv = typeof raw === 'string' ? raw.charCodeAt(0) : Number(raw || 0);
            sortCache.set(nodeJ.id, jv);
          }
          newRow[j] = (v * Math.abs(iv - jv) * sortStrength) / riScale;
        } else {
          newRow[j] = (v * linkDistance) / riScale;
        }
      } else {
        newRow[j] = v * baseLink;
      }
    }
  }

  return result;
};

/** Weight matrix: 1 / d^2 with zeros preserved */
const getWeightMatrix = (idealDistances: Matrix[]): Matrix[] => {
  const n = idealDistances.length;
  const out: Matrix[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const row = idealDistances[i];
    const wRow = new Array(n);
    for (let j = 0; j < n; j++) {
      const v = row[j];
      wRow[j] = v === 0 ? 0 : 1 / (v * v);
    }
    out[i] = wRow;
  }
  return out;
};

// ---------------- APSP helpers (adaptive) -----------------

/**
 * Heuristic chooser: if graph small or dense → floydWarshall else → johnson
 * This function expects adjMatrix to be full NxN matrix with Infinity where no edge.
 */
const chooseAPSP = (adjMatrix: number[][]): number[][] => {
  const n = adjMatrix.length;
  if (n === 0) return [];

  // compute edge count quickly
  let edges = 0;
  for (let i = 0; i < n; i++) {
    const row = adjMatrix[i];
    for (let j = 0; j < n; j++) {
      if (i !== j && row[j] > 0 && row[j] !== Infinity) edges++;
    }
  }

  // density: edges / (n*(n-1))
  const density = edges / (n * (n - 1));

  // thresholds (empirical): if n small (<200) or density > 0.05 use floyd
  if (n <= 200 || density > 0.05) {
    return floydWarshall(adjMatrix);
  }

  // otherwise use Johnson with adjacency list to reduce allocations
  const adjList = getAdjListFromMatrix(adjMatrix);
  return johnsonAdjList(adjList, n);
};

// We'll include a compact floydWarshall here for completeness (same semantics)
const floydWarshall = (adjMatrix: Matrix[]): Matrix[] => {
  const n = adjMatrix.length;
  const dist: Matrix = Array.from({ length: n }, (_, i) => {
    const row = adjMatrix[i];
    const out = new Array(n);
    for (let j = 0; j < n; j++) {
      out[j] = i === j ? 0 : row[j] > 0 ? row[j] : Infinity;
    }
    return out;
  });

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
        if (next < di[j]) di[j] = next;
      }
    }
  }

  return dist;
};

// ----- Johnson on adjacency list (lower allocations) -----

/**
 * Convert adjacency matrix to adjacency list with edges only present
 * Each entry: [v, w]
 */
const getAdjListFromMatrix = (matrix: number[][]): [number, number][][] => {
  const n = matrix.length;
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (let u = 0; u < n; u++) {
    const row = matrix[u];
    const out = adj[u];
    for (let v = 0; v < n; v++) {
      const w = row[v];
      if (u !== v && w !== Infinity && w > 0) out.push([v, w]);
    }
  }
  return adj;
};

/**
 * Johnson adapted to adjacency list (much fewer temporary arrays/objects)
 */
const johnsonAdjList = (adj: [number, number][][], n: number): number[][] => {
  if (n === 0) return [];

  // Build edge list for Bellman-Ford
  const edges: [number, number, number][] = [];
  for (let u = 0; u < n; u++) {
    const row = adj[u];
    for (let k = 0; k < row.length; k++) {
      const [v, w] = row[k];
      edges.push([u, v, w]);
    }
  }

  // virtual edges from source Q (-1) to every v with weight 0
  for (let v = 0; v < n; v++) edges.push([-1, v, 0]);

  const h = bellmanFord(edges, n);
  if (!h) throw new Error('Negative cycle detected in Johnson');

  // reweight adjacency to non-negative
  const reweighted: [number, number][][] = Array.from({ length: n }, () => []);
  for (let u = 0; u < n; u++) {
    const row = adj[u];
    const out = reweighted[u];
    for (let k = 0; k < row.length; k++) {
      const [v, w] = row[k];
      out.push([v, w + h[u] - h[v]]);
    }
  }

  const dist: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(Infinity),
  );

  for (let s = 0; s < n; s++) {
    const d = dijkstra(reweighted, s, n);
    for (let t = 0; t < n; t++) {
      if (d[t] < Infinity) dist[s][t] = d[t] - h[s] + h[t];
    }
  }

  return dist;
};

/**
 * Bellman-Ford to compute potentials h[]. We initialize dist[] = 0 for all
 * nodes (as if there is a virtual 0-edge source to each node), relaxing edges.
 */
const bellmanFord = (
  edges: [number, number, number][],
  n: number,
): number[] | null => {
  const dist = new Array(n).fill(Infinity);
  for (let v = 0; v < n; v++) dist[v] = 0; // virtual source

  for (let iter = 0; iter < n - 1; iter++) {
    let updated = false;
    for (let e = 0; e < edges.length; e++) {
      const [u, v, w] = edges[e];
      const du = u === -1 ? 0 : dist[u];
      if (du + w < dist[v]) {
        dist[v] = du + w;
        updated = true;
      }
    }
    if (!updated) break;
  }

  // check negative cycle
  for (let e = 0; e < edges.length; e++) {
    const [u, v, w] = edges[e];
    const du = u === -1 ? 0 : dist[u];
    if (du + w < dist[v]) return null;
  }

  return dist;
};

/**
 * Dijkstra using binary heap but avoiding tuple allocations by using two parallel arrays in heap
 */
const dijkstra = (
  adj: [number, number][][],
  start: number,
  n: number,
): number[] => {
  const dist = new Array(n).fill(Infinity);
  dist[start] = 0;

  const heap = new BinaryMinHeap(n);
  heap.push(start, 0);

  while (!heap.isEmpty()) {
    const { key: u, priority: d } = heap.pop();
    if (d > dist[u]) continue;
    const row = adj[u];
    for (let i = 0; i < row.length; i++) {
      const [v, w] = row[i];
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        heap.push(v, nd);
      }
    }
  }

  return dist;
};

// Binary heap specialized to (key:number, priority:number)
class BinaryMinHeap {
  private keys: number[] = [];
  private pri: number[] = [];

  constructor(_capacity = 0) {}

  isEmpty() {
    return this.keys.length === 0;
  }

  push(key: number, priority: number) {
    const i = this.keys.length;
    this.keys.push(key);
    this.pri.push(priority);
    this.bubbleUp(i);
  }

  pop(): { key: number; priority: number } {
    const key = this.keys[0];
    const priority = this.pri[0];
    const tailKey = this.keys.pop()!;
    const tailPri = this.pri.pop()!;
    if (this.keys.length > 0) {
      this.keys[0] = tailKey;
      this.pri[0] = tailPri;
      this.bubbleDown(0);
    }
    return { key, priority };
  }

  private bubbleUp(i: number) {
    const keys = this.keys;
    const pri = this.pri;
    const key = keys[i];
    const p = pri[i];
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (pri[parent] <= p) break;
      keys[i] = keys[parent];
      pri[i] = pri[parent];
      i = parent;
    }
    keys[i] = key;
    pri[i] = p;
  }

  private bubbleDown(i: number) {
    const keys = this.keys;
    const pri = this.pri;
    const n = keys.length;
    const key = keys[i];
    const p = pri[i];

    while (true) {
      let left = i * 2 + 1;
      let right = left + 1;
      let smallest = i;
      if (left < n && pri[left] < pri[smallest]) smallest = left;
      if (right < n && pri[right] < pri[smallest]) smallest = right;
      if (smallest === i) break;
      keys[i] = keys[smallest];
      pri[i] = pri[smallest];
      i = smallest;
    }
    keys[i] = key;
    pri[i] = p;
  }
}

// ---------------- misc helpers -----------------

/**
 * If MDS produced invalid values (NaN), fallback to small random radius scatter
 */
const mdsFallback = (
  mdsRes: number[][],
  n: number,
  linkDistance: number,
): number[][] => {
  if (!mdsRes || mdsRes.length !== n) {
    const out: number[][] = new Array(n);
    for (let i = 0; i < n; i++)
      out[i] = [Math.random() * linkDistance, Math.random() * linkDistance];
    return out;
  }
  // sanitize NaNs
  for (let i = 0; i < n; i++) {
    const p = mdsRes[i];
    if (!p || Number.isNaN(p[0]) || Number.isNaN(p[1]))
      mdsRes[i] = [Math.random() * linkDistance, Math.random() * linkDistance];
  }
  return mdsRes;
};

// ---------------- End of file -----------------
