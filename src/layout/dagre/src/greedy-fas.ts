import graphlib from './graphlib';
import List from './data/list';
import { graphlib as IGraphLib, Node } from '../graphlib';

type IGraph = IGraphLib.Graph;
const Graph = (graphlib as any).Graph;


/*
 * A greedy heuristic for finding a feedback arc set for a graph. A feedback
 * arc set is a set of edges that can be removed to make a graph acyclic.
 * The algorithm comes from: P. Eades, X. Lin, and W. F. Smyth, "A fast and
 * effective heuristic for the feedback arc set problem." This implementation
 * adjusts that from the paper to allow for weighted edges.
 */
// module.exports = greedyFAS;

const DEFAULT_WEIGHT_FN = () => 1;

const greedyFAS = (g: IGraph, weightFn: () => unknown) => {
  if (g.nodeCount() <= 1) return [];
  const state = buildState(g, weightFn || DEFAULT_WEIGHT_FN);
  const results = doGreedyFAS(state.graph as any, state.buckets, state.zeroIdx);

  // Expand multi-edges
  // @ts-ignore
  return results.map((e: any) => g.outEdges(e.v, e.w))?.flat();
};

const doGreedyFAS = (g: IGraph, buckets: any, zeroIdx: number) => {
  let results: Node[] = [];
  const sources = buckets[buckets.length - 1];
  const sinks = buckets[0];

  let entry;
  while (g.nodeCount()) {
    while ((entry = sinks.dequeue()))   { removeNode(g, buckets, zeroIdx, entry); }
    while ((entry = sources.dequeue())) { removeNode(g, buckets, zeroIdx, entry); }
    if (g.nodeCount()) {
      for (let i = buckets.length - 2; i > 0; --i) {
        entry = buckets[i].dequeue();
        if (entry) {
          results = results.concat(removeNode(g, buckets, zeroIdx, entry, true));
          break;
        }
      }
    }
  }

  return results;
};

const removeNode = (g: IGraph, buckets: any, zeroIdx: number, entry: any, collectPredecessors?: boolean) => {
  const results: any = collectPredecessors ? [] : undefined;

  g.inEdges(entry.v)?.forEach((edge) => {
    const weight: any = g.edge(edge);
    const uEntry: Node = g.node(edge.v);

    if (collectPredecessors) {
      results.push({ v: edge.v, w: edge.w });
    }
    if (uEntry.out === undefined) uEntry.out = 0;
    uEntry.out -= weight;
    assignBucket(buckets, zeroIdx, uEntry);
  });

  g.outEdges(entry.v)?.forEach((edge) => {
    const weight: any = g.edge(edge);
    const w = edge.w;
    const wEntry = g.node(w);
    if (wEntry.in === undefined) wEntry.in = 0;
    wEntry.in -= weight;
    assignBucket(buckets, zeroIdx, wEntry);
  });

  g.removeNode(entry.v);

  return results;
};

const buildState = (g: IGraph, weightFn?: (param: any) => unknown) => {
  const fasGraph = new Graph();
  let maxIn = 0;
  let maxOut = 0;

  g.nodes().forEach((v) => {
    fasGraph.setNode(v, { v, "in": 0, out: 0 });
  });

  // Aggregate weights on nodes, but also sum the weights across multi-edges
  // into a single edge for the fasGraph.
  g.edges().forEach((e) => {
    const prevWeight = fasGraph.edge(e.v, e.w) || 0;
    const weight = weightFn?.(e);
    const edgeWeight = prevWeight + weight;
    fasGraph.setEdge(e.v, e.w, edgeWeight);
    maxOut = Math.max(maxOut, fasGraph.node(e.v).out += weight);
    maxIn  = Math.max(maxIn,  fasGraph.node(e.w)["in"]  += weight);
  });

  const buckets: any = [];
  const rangeMax = maxOut + maxIn + 3;
  for (let i = 0; i < rangeMax; i ++) {
    buckets.push(new List());
  }
  const zeroIdx = maxIn + 1;

  fasGraph.nodes().forEach((v: string) => {
    assignBucket(buckets, zeroIdx, fasGraph.node(v));
  });

  return { buckets, zeroIdx, graph: fasGraph };
};

const assignBucket = (buckets: any, zeroIdx: number, entry: any) => {
  if (!entry.out) {
    buckets[0].enqueue(entry);
  } else if (!entry["in"]) {
    buckets[buckets.length - 1].enqueue(entry);
  } else {
    buckets[entry.out - entry["in"] + zeroIdx].enqueue(entry);
  }
};


export default greedyFAS;